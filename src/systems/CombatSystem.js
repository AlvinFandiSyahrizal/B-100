// ============================================================
// CombatSystem.js — engine combat turn-based
// Mengatur alur giliran, resolusi kartu, kalkulasi damage
// Tidak tahu soal Phaser — murni logika game
// ============================================================

import { DeckSystem }  from './DeckSystem.js';
import {
    ENERGY_PER_TURN, HAND_SIZE,
    STAT, DMG_TYPE, STATUS
} from '../config/constants.js';

export const COMBAT_STATE = {
    PLAYER_TURN:  'player_turn',
    ENEMY_TURN:   'enemy_turn',
    WIN:          'win',
    LOSE:         'lose',
};

export class CombatSystem {
    /**
     * @param {Player}    player
     * @param {Monster[]} monsters - bisa lebih dari satu
     */
    constructor(player, monsters) {
        this.player   = player;
        this.monsters = monsters;   // array monster aktif

        this.state     = COMBAT_STATE.PLAYER_TURN;
        this.turn      = 1;
        this.log       = [];        // log semua event combat (untuk UI)

        // Siapa yang jalan duluan? — AGI player vs AGI monster tertinggi
        this._determineOrder();
    }

    // ── Setup ─────────────────────────────────────────────────

    _determineOrder() {
        const highestEnemyAgi = Math.max(
            ...this.monsters.map(m => m.stats[STAT.AGI] || 0)
        );
        // Kalau player AGI lebih tinggi, player duluan (sudah default)
        // Kalau monster lebih tinggi, monster duluan
        if (highestEnemyAgi > this.player.stats[STAT.AGI]) {
            this.state = COMBAT_STATE.ENEMY_TURN;
        }
    }

    /** Mulai combat — setup awal hand player. */
    start() {
        DeckSystem.shuffle(this.player.deck);

        if (this.state === COMBAT_STATE.PLAYER_TURN) {
            // Player duluan — setup turn normal
            this._startPlayerTurn();
        } else {
            // Monster duluan — set energy dan draw dulu biar player bisa lihat hand
            // sebelum musuh menyerang di turn pertama
            this.player.energy = ENERGY_PER_TURN;
            this.player.block  = 0;
            DeckSystem.draw(this.player, HAND_SIZE);
            this._addLog(`── Musuh lebih cepat! ──`);
            this._startEnemyTurn();
            this._processEnemyTurn();
        }
    }

    // ── Player Turn ───────────────────────────────────────────

    _startPlayerTurn() {
        this.state         = COMBAT_STATE.PLAYER_TURN;
        this.player.energy = ENERGY_PER_TURN;
        this.player.block  = this._keepPersistBlock(this.player);

        // Tick status effect player
        this._tickPlayerStatus();
        if (this.player.isDead) {
            this.state = COMBAT_STATE.LOSE;
            return;
        }

        // Draw kartu
        DeckSystem.draw(this.player, HAND_SIZE);

        this._addLog(`── Giliran ${this.turn} (Player) ──`);
        this._addLog(`Energi: ${this.player.energy} | HP: ${this.player.hp}/${this.player.stats[STAT.HP_MAX]}`);
    }

    // ── Helpers ─────────────────────────────────────────────────

    /**
     * Hitung effective cost kartu setelah semua modifier.
     * Curse cost reduction, stance, dll diterapkan di sini.
     */
    getEffectiveCost(card) {
        let cost = card.cost ?? 1;

        // Kutukan darah: cost -1 untuk semua kartu
        if (this.player._curseReduction) {
            cost = Math.max(0, cost - this.player._curseReduction);
        }

        // Kartu gratis dari efek pengorbanan
        if (this.player._nextCardFree) {
            return 0;
        }

        return Math.max(0, cost);
    }

    /**
     * Cek apakah player bisa mainkan kartu berdasarkan effective cost.
     */
    canPlayCard(card) {
        return this.getEffectiveCost(card) <= this.player.energy;
    }

    /**
     * Mainkan kartu dari tangan player.
     */
    playCard(handIndex, targetIdx = 0) {
        if (this.state !== COMBAT_STATE.PLAYER_TURN) {
            return { success: false, events: [] };
        }

        const card = this.player.hand[handIndex];
        if (!card) return { success: false, events: [{ type: 'no_card' }] };

        const effectiveCost = this.getEffectiveCost(card);
        if (effectiveCost > this.player.energy) {
            this._addLog(`Energi tidak cukup untuk ${card.name}!`);
            return { success: false, events: [{ type: 'no_energy' }] };
        }

        // Pakai kartu
        this.player.hand.splice(handIndex, 1);
        this.player.energy -= effectiveCost;
        this.player.discard.push(card);

        // Reset next card free setelah dipakai
        if (this.player._nextCardFree) {
            this.player._nextCardFree = false;
        }

        // Taiko: naikkan taiko counter
        const taikoBuff = this.player.statusEffects?.find(s => s.type === 'taiko');
        if (taikoBuff) {
            if (!this.player._taikoCount) this.player._taikoCount = 0;
            this.player._taikoCount++;
        }

        const events = this._resolveCard(card, targetIdx);
        this._addLog(`Player pakai: ${card.name} (cost ${effectiveCost})`);

        if (this._allMonstersDead()) {
            this.state = COMBAT_STATE.WIN;
        }

        return { success: true, events };
    }

    /**
     * Player selesai giliran (tekan End Turn atau energi habis).
     */
    endPlayerTurn() {
        if (this.state !== COMBAT_STATE.PLAYER_TURN) return [];

        DeckSystem.discardHand(this.player);
        this.turn++;
        this._startEnemyTurn();

        return this._processEnemyTurn();
    }

    // ── Enemy Turn ────────────────────────────────────────────

    _startPlayerTurn() {
        this.state         = COMBAT_STATE.PLAYER_TURN;
        this.player.energy = ENERGY_PER_TURN;
        this.player.block  = this._keepPersistBlock(this.player);

        // Reset taiko counter tiap awal giliran
        this.player._taikoCount = 0;

        this._tickPlayerStatus();
        if (this.player.isDead) {
            this.state = COMBAT_STATE.LOSE;
            return;
        }

        // Draw kartu + extra draw dari curse
        const extraDraw = this.player._extraDraw || 0;
        DeckSystem.draw(this.player, HAND_SIZE + extraDraw);

        this._addLog(`── Giliran ${this.turn} (Player) ──`);
    }

    _startEnemyTurn() {
        this.state = COMBAT_STATE.ENEMY_TURN;
        this._addLog(`── Giliran Musuh ──`);
    }

    /**
     * Proses semua aksi musuh, kembalikan array events.
     * Dipanggil setelah player end turn.
     */
    _processEnemyTurn() {
        const allEvents = [];

        for (const monster of this.monsters) {
            if (monster.isDead) continue;

            const action = monster.executeAction();

            // Cek mati dari status effect yang di-tick di executeAction
            if (monster.isDead) {
                allEvents.push({ type: 'monster_died_status', monsterId: monster.id });
                this._addLog(`${monster.name} mati karena status effect.`);
                continue;
            }

            const events = this._resolveMonsterAction(monster, action);
            allEvents.push(...events);

            if (this.player.isDead) {
                this.state = COMBAT_STATE.LOSE;
                break;
            }
        }

        // Cek semua monster mati (termasuk dari status effect)
        if (this._allMonstersDead()) {
            this.state = COMBAT_STATE.WIN;
        } else if (this.state !== COMBAT_STATE.LOSE) {
            this._startPlayerTurn();
        }

        return allEvents;
    }

    // ── Card Resolution ───────────────────────────────────────

    _resolveCard(card, targetIdx) {
        const events = [];
        const target = this.monsters[targetIdx] || this.monsters[0];

        // ── Curse Cards ───────────────────────────────────────
        if (card.isCurse) {
            // Terapkan curse effect ke player
            if (card.curseEffect?.damage) {
                // Burn per turn — ditangani di _tickPlayerStatus
                this.player.addStatus('curse_burn', card.curseEffect.damage, 999);
            }
            if (card.curseEffect?.hpMaxReduce) {
                // HP max berkurang — terapkan langsung
                const reduction = Math.floor(
                    this.player.stats['hp_max'] * (card.curseEffect.hpMaxReduce / 100)
                );
                this.player.stats['hp_max'] = Math.max(10, this.player.stats['hp_max'] - reduction);
                this.player.hp = Math.min(this.player.hp, this.player.stats['hp_max']);
            }
            if (card.curseEffect?.noHeal) {
                this.player._noHeal = true;
            }
            // Terapkan benefit
            if (card.curseBenefit?.costReduction) {
                this.player._curseReduction = (this.player._curseReduction || 0) + card.curseBenefit.costReduction;
                events.push({ type: 'curse_benefit', benefit: 'cost_reduction', value: card.curseBenefit.costReduction });
                this._addLog(`Kutukan aktif! Cost semua kartu -${card.curseBenefit.costReduction}.`);
            }
            if (card.curseBenefit?.extraDraw) {
                this.player._extraDraw = (this.player._extraDraw || 0) + card.curseBenefit.extraDraw;
                events.push({ type: 'curse_benefit', benefit: 'extra_draw', value: card.curseBenefit.extraDraw });
            }
            if (card.curseBenefit?.damageBonus) {
                this.player._damageBonus = (this.player._damageBonus || 0) + card.curseBenefit.damageBonus;
                events.push({ type: 'curse_benefit', benefit: 'damage_bonus', value: card.curseBenefit.damageBonus });
                this._addLog(`Kutukan aktif! Semua damage +${card.curseBenefit.damageBonus}%.`);
            }
        }

        // ── Pengorbanan — buang kartu random, next card free ──
        if (card.sacrificeCard && this.player.hand.length > 0) {
            const sacrificeIdx = Math.floor(Math.random() * this.player.hand.length);
            const sacrificed   = this.player.hand.splice(sacrificeIdx, 1)[0];
            this.player.discard.push(sacrificed);
            this.player._nextCardFree = true;
            events.push({ type: 'sacrifice', cardName: sacrificed.name });
            this._addLog(`Pengorbanan! ${sacrificed.name} dibuang. Kartu berikutnya gratis.`);
        }

        // ── Heal ─────────────────────────────────────────────
        if (card.heal) {
            const healed = this.player.heal(card.heal);
            events.push({ type: 'heal', amount: healed });
            this._addLog(`Player heal ${healed} HP.`);
        }

        // ── Draw kartu ────────────────────────────────────────
        if (card.drawCards) {
            DeckSystem.draw(this.player, card.drawCards);
            events.push({ type: 'draw', count: card.drawCards });
        }

        // ── Stance ────────────────────────────────────────────
        if (card.stance) {
            this.player._stance = card.stance;
            events.push({ type: 'stance', stance: card.stance });
            this._addLog(`Player masuk ${card.stance} stance.`);
        }

        // ── Damage ────────────────────────────────────────────
        if (card.damage && target) {
            let targets = card.targetAll
                ? this.monsters.filter(m => !m.isDead)
                : [target];

            for (const t of targets) {
                let dmg = card.damage;

                // Stat scaling
                if (card.strScaling) dmg += Math.floor(this.player.stats['str'] * 0.5);
                if (card.intScaling) dmg += Math.floor(this.player.stats['int'] * 0.6);
                if (card.agiScaling) dmg += Math.floor(this.player.stats['agi'] * 0.4);

                // Sinergi Burn
                if (card.burnBonus && t.hasStatus('burn')) dmg *= 2;

                // Sinergi Wet + petir
                if (card.wetBonus && t.hasStatus('wet')) {
                    dmg *= 2;
                    // Kalau targetAll juga, sudah dihandle di atas
                }

                // Desperate: damage dari missing HP
                if (card.desperateDmg) {
                    const missingHp = this.player.stats['hp_max'] - this.player.hp;
                    const mult = card.desperateMultiplier || 1;
                    dmg = card.baseDamage + Math.floor(missingHp * mult);
                }

                // Snipe: x3/x4 kalau musuh punya status
                if (card.statusBonus && t.statusEffects.length > 0) {
                    dmg *= (card.statusMultiplier || 3);
                }

                // Iaijutsu: damage dari jumlah kartu di tangan
                if (card.iaijutsu) {
                    const mult = card.iaijutsuMultiplier || 4;
                    dmg = this.player.hand.length * mult;
                }

                // Focus buff
                const focusBuff = this.player.statusEffects?.find(s => s.type === 'focus');
                if (focusBuff) {
                    dmg = Math.floor(dmg * (focusBuff.value >= 2 ? 2 : 1.5));
                    this.player.removeStatus('focus');
                }

                // Taiko buff
                const taikoBuff = this.player.statusEffects?.find(s => s.type === 'taiko');
                if (taikoBuff) dmg += taikoBuff.value;

                // Curse damage bonus
                if (this.player._damageBonus) {
                    dmg = Math.floor(dmg * (1 + this.player._damageBonus / 100));
                }

                // Taiko: damage naik sesuai jumlah kartu yang sudah dipakai turn ini
                const taikoBuff = this.player.statusEffects?.find(s => s.type === 'taiko');
                if (taikoBuff && this.player._taikoCount > 0) {
                    dmg += taikoBuff.value * this.player._taikoCount;
                }

                // Stance attack bonus
                if (this.player._stance === 'attack') dmg = Math.floor(dmg * 1.3);

                // Chill: kurangi damage yang diterima musuh (bukan damage player)
                // Chill di player berarti musuh damage berkurang — handled di monster action
                // Chill di musuh berarti musuh jadi lemah vs semua damage
                if (t.hasStatus('chill')) {
                    const chillEffect = t.statusEffects.find(s => s.type === 'chill');
                    // Chill tidak kurangi damage yang masuk ke musuh
                    // Chill kurangi damage yang keluar dari musuh (ditangani di _resolveMonsterAction)
                }

                // Execut: instant kill di bawah threshold
                if (card.executeThreshold && t.hpPercent * 100 <= card.executeThreshold) {
                    t.hp = 0;
                    events.push({ type: 'execute', target: t.id });
                    this._addLog(`EKSEKUSI! ${t.name} langsung KO!`);
                    continue;
                }

                // Multi-hit
                const hits = card.hits || 1;
                let totalDmg = 0;
                for (let i = 0; i < hits; i++) {
                    const actual = t.takeDamage(dmg, card.damageType || 'physical');
                    totalDmg += actual;
                }

                // Cek fase transition setelah damage
                const phaseResult = t.checkPhaseTransition();
                if (phaseResult?.triggered) {
                    events.push({
                        type:         'phase_change',
                        monsterId:    t.id,
                        phaseIndex:   phaseResult.phaseIndex,
                        announcement: phaseResult.phase.announcement,
                    });
                }

                events.push({
                    type:   'damage',
                    target: t.id,
                    amount: totalDmg,
                    hits,
                    damageType: card.damageType,
                });
                this._addLog(`${t.name} kena ${totalDmg} damage.`);
            }

            // Iaijutsu: kosongi tangan setelah dipakai
            if (card.emptyHand) {
                this.player.discard.push(...this.player.hand);
                this.player.hand = [];
                events.push({ type: 'empty_hand' });
            }
        }

        // ── Block ─────────────────────────────────────────────
        if (card.block) {
            let blockAmt = card.block;
            if (card.strScaling) blockAmt += Math.floor(this.player.stats['str'] * 0.3);
            if (this.player._stance === 'defend') blockAmt = Math.floor(blockAmt * 2);

            if (card.requiresBlock && this.player.block > 0 && card.bonusDamage && target) {
                const actual = target.takeDamage(card.bonusDamage, 'physical');
                events.push({ type: 'damage', target: target.id, amount: actual, hits: 1 });
            }

            this.player.addBlock(blockAmt);
            this.player._blockPersist = card.blockPersist || false;
            events.push({ type: 'block', amount: blockAmt });
        }

        // ── Last Stand heal ───────────────────────────────────
        if (card.lastStand) {
            const hpPercent = (this.player.hp / this.player.stats['hp_max']) * 100;
            if (hpPercent <= 20) {
                const healAmt = Math.floor(this.player.stats['hp_max'] * (card.healPercent / 100));
                this.player.heal(healAmt);
                if (card.gainBlock) this.player.addBlock(card.gainBlock);
                events.push({ type: 'last_stand', heal: healAmt });
                this._addLog(`Last Stand! Heal ${healAmt} HP.`);
            }
        }

        // ── Haste: tambah energi ──────────────────────────────
        const hasteBuff = card.effects?.find(e => e.type === 'haste');
        if (hasteBuff) {
            this.player.energy += hasteBuff.value;
            events.push({ type: 'energy_gain', amount: hasteBuff.value });
            this._addLog(`Haste! +${hasteBuff.value} energi.`);
        }

        // ── Status Effects ke musuh ───────────────────────────
        if (card.effects && card.effects.length > 0 && target) {
            for (const effect of card.effects) {
                if (['haste', 'focus', 'fortify', 'echo', 'taiko'].includes(effect.type)) {
                    // Efek buff ke player, bukan ke musuh
                    if (effect.type !== 'haste') {
                        this.player.addStatus(effect.type, effect.value, effect.duration);
                        events.push({ type: 'buff_player', status: effect.type, value: effect.value });
                    }
                    continue;
                }

                // Status ke semua musuh kalau targetAll
                const statusTargets = card.targetAll
                    ? this.monsters.filter(m => !m.isDead)
                    : [target];

                for (const t of statusTargets) {
                    t.addStatus(effect.type, effect.value, effect.duration);
                    events.push({
                        type:     'apply_status',
                        target:   t.id,
                        status:   effect.type,
                        value:    effect.value,
                        duration: effect.duration,
                    });
                }
                this._addLog(`${effect.type} ${effect.value} diaplikasikan.`);
            }
        }

        // ── Catalyze: double semua status musuh ───────────────
        if (card.catalyze && target) {
            for (const effect of target.statusEffects) {
                effect.value = Math.floor(effect.value * 2);
            }
            events.push({ type: 'catalyze', target: target.id });
            this._addLog(`Catalyze! Semua status effect ${target.name} di-double.`);
        }

        // ── Dodge buff dari kartu defense ─────────────────────
        if (card.effects) {
            const dodgeEffect = card.effects.find(e => e.type === 'dodge');
            if (dodgeEffect) {
                this.player.addStatus('dodge', dodgeEffect.value, dodgeEffect.duration);
                events.push({ type: 'dodge_buff', value: dodgeEffect.value });
            }
        }

        // Cek menang setelah resolve
        if (this._allMonstersDead()) this.state = COMBAT_STATE.WIN;

        return events;
    }

    /**
     * Resolve aksi monster.
     */
    _resolveMonsterAction(monster, action) {
        const events = [];

        if (action.type === 'stunned') {
            events.push({ type: 'monster_stunned', monsterId: monster.id });
            this._addLog(`${monster.name} ter-stun, tidak bisa beraksi.`);
            return events;
        }

        if (action.type === 'attack') {
            // Cek dodge player
            const dodgeStatus = this.player.statusEffects?.find(s => s.type === 'dodge');
            const dodgeChance = (this.player.stats['dodge'] || 0) + (dodgeStatus?.value || 0);

            if (Math.random() * 100 < dodgeChance) {
                events.push({ type: 'dodge', target: 'player' });
                this._addLog(`Player dodge serangan ${monster.name}!`);

                // Stance flow: dapat 1 energi saat dodge
                if (this.player._stance === 'flow') {
                    this.player.energy = Math.min(this.player.energy + 1, ENERGY_PER_TURN + 3);
                    events.push({ type: 'energy_gain', amount: 1 });
                }
                return events;
            }

            let dmg = action.damage || 0;

            // Chill di musuh: kurangi damage keluarnya
            if (monster.hasStatus('chill')) {
                const chillEffect = monster.statusEffects.find(s => s.type === 'chill');
                if (chillEffect) dmg = Math.floor(dmg * (1 - chillEffect.value / 100));
            }

            // Stance defend: kurangi damage yang diterima
            if (this.player._stance === 'defend') {
                dmg = Math.floor(dmg * 0.7);
            }

            const actual = this.player.takeDamage(dmg, action.damageType || 'physical');

            // Simpan damage terakhir untuk kartu Balas Dendam
            this.player._lastDamageTaken = actual;

            events.push({
                type:   'damage',
                target: 'player',
                amount: actual,
                source: monster.id,
            });
            this._addLog(`${monster.name} menyerang. Player kena ${actual} damage.`);
        }

        if (action.type === 'buff') {
            if (action.block) {
                monster.addBlock(action.block);
                events.push({ type: 'monster_block', monsterId: monster.id, amount: action.block });
                this._addLog(`${monster.name} dapat Block ${action.block}.`);
            }
        }

        // Status effect dari serangan musuh
        if (action.effects) {
            for (const eff of action.effects) {
                this.player.addStatus(eff.type, eff.value, eff.duration);
                events.push({ type: 'apply_status', target: 'player', status: eff.type, value: eff.value });
            }
        }

        return events;
    }

    // ── Helpers ───────────────────────────────────────────────

    _keepPersistBlock(player) {
        // Block carry-over kalau ada kartu blockPersist aktif
        return player._blockPersist ? player.block : 0;
    }

    _tickPlayerStatus() {
        for (const effect of [...(this.player.statusEffects || [])]) {
            if (['burn', 'poison', 'bleed'].includes(effect.type)) {
                const dmg = this.player.takeDamage(effect.value, DMG_TYPE.TRUE);
                this._addLog(`${effect.type}: Player kena ${dmg} damage.`);
            }
            effect.duration--;
        }
        this.player.statusEffects = (this.player.statusEffects || []).filter(s => s.duration > 0);
    }

    _allMonstersDead() {
        return this.monsters.every(m => m.isDead);
    }

    _addLog(msg) {
        this.log.push(msg);
        // Batasi log 100 baris biar tidak bocor memori
        if (this.log.length > 100) this.log.shift();
    }

    get isOver() {
        return this.state === COMBAT_STATE.WIN || this.state === COMBAT_STATE.LOSE;
    }

    get playerWon() {
        return this.state === COMBAT_STATE.WIN;
    }
}