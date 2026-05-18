// ============================================================
// CombatSystem.js — engine combat turn-based
// Bersih, tidak ada duplikat, semua buff/debuff timing benar
// ============================================================

import { DeckSystem }  from './DeckSystem.js';
import {
    ENERGY_PER_TURN, HAND_SIZE, STAT, DMG_TYPE
} from '../config/constants.js';

export const COMBAT_STATE = {
    PLAYER_TURN: 'player_turn',
    ENEMY_TURN:  'enemy_turn',
    WIN:         'win',
    LOSE:        'lose',
};

export class CombatSystem {

    constructor(player, monsters) {
        this.player   = player;
        this.monsters = monsters;
        this.state    = COMBAT_STATE.PLAYER_TURN;
        this.turn     = 1;
        this.log      = [];

        // Tentukan siapa yang jalan duluan berdasarkan AGI
        const highestEnemyAgi = Math.max(...monsters.map(m => m.stats[STAT.AGI] || 0));
        if (highestEnemyAgi > (this.player.stats[STAT.AGI] || 0)) {
            this.state = COMBAT_STATE.ENEMY_TURN;
        }
    }

    // ── Public API ────────────────────────────────────────────

    start() {
        DeckSystem.shuffle(this.player.deck);

        // Reset semua buff sementara dari combat sebelumnya
        this._resetAllTempBuffs();

        if (this.state === COMBAT_STATE.PLAYER_TURN) {
            this._startPlayerTurn();
        } else {
            // Monster duluan: draw dulu biar player bisa lihat hand
            this.player.energy = ENERGY_PER_TURN;
            this.player.block  = 0;
            DeckSystem.draw(this.player, HAND_SIZE);
            this._startEnemyTurn();
            this._processEnemyTurn();
        }
    }

    /**
     * Hitung cost efektif kartu setelah semua modifier.
     */
    getEffectiveCost(card) {
        if (this.player._nextCardFree) return 0;
        const reduction = this.player._curseReduction || 0;
        return Math.max(0, (card.cost ?? 0) - reduction);
    }

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
            return { success: false, events: [{ type: 'no_energy' }] };
        }

        // Eksekusi kartu
        this.player.hand.splice(handIndex, 1);
        this.player.energy -= effectiveCost;
        this.player.discard.push(card);

        // Reset next card free setelah dipakai
        if (this.player._nextCardFree) this.player._nextCardFree = false;

        // Naikkan taiko counter
        this.player._taikoCount = (this.player._taikoCount || 0) + 1;

        let events = this._resolveCard(card, targetIdx);

        // Echo: jalankan kartu lagi sekali
        if (this.player._echoActive) {
            this.player._echoActive = false;
            const echoEvents = this._resolveCard(card, targetIdx);
            events = [...events, ...echoEvents, { type: 'echo_triggered' }];
        }

        if (this._allMonstersDead()) this.state = COMBAT_STATE.WIN;

        return { success: true, events };
    }

    /**
     * Player selesai giliran.
     */
    endPlayerTurn() {
        if (this.state !== COMBAT_STATE.PLAYER_TURN) return [];

        DeckSystem.discardHand(this.player);
        this.turn++;
        this._startEnemyTurn();
        return this._processEnemyTurn();
    }

    get isOver()     { return this.state === COMBAT_STATE.WIN || this.state === COMBAT_STATE.LOSE; }
    get playerWon()  { return this.state === COMBAT_STATE.WIN; }

    // ── Player Turn ───────────────────────────────────────────

    _startPlayerTurn() {
        this.state        = COMBAT_STATE.PLAYER_TURN;
        this.player.energy = ENERGY_PER_TURN;
        this.player.block  = this.player._blockPersist ? this.player.block : 0;

        // Apply bonus energi dari kartu Tunda turn sebelumnya
        if (this.player._nextTurnEnergy) {
            this.player.energy += this.player._nextTurnEnergy;
            this.player._nextTurnEnergy = 0;
        }

        // Tick status effect player (burn, poison, bleed dari musuh)
        this._tickPlayerStatus();
        if (this.player.isDead) {
            this.state = COMBAT_STATE.LOSE;
            return;
        }

        // Reset buff PER TURN (bukan permanen)
        this.player._taikoCount  = 0;
        this.player._echoActive  = false;
        this.player._focusActive = 0;

        // Refresh curse cost reduction dari status effect
        const curseCost = this.player.statusEffects?.find(s => s.type === 'curse_cost');
        this.player._curseReduction = curseCost ? curseCost.value : 0;

        // Draw kartu + bonus draw
        const extraDraw = (this.player._nextTurnDraw || 0) + (this.player._extraDraw || 0);
        this.player._nextTurnDraw = 0;
        DeckSystem.draw(this.player, HAND_SIZE + extraDraw);

        this._addLog(`── Giliran ${this.turn} (Player) ── Energi: ${this.player.energy}`);
    }

    // ── Enemy Turn ────────────────────────────────────────────

    _startEnemyTurn() {
        this.state = COMBAT_STATE.ENEMY_TURN;
    }

    _processEnemyTurn() {
        const allEvents = [];

        for (const monster of this.monsters) {
            if (monster.isDead) continue;

            const action = monster.executeAction();

            if (monster.isDead) {
                allEvents.push({ type: 'monster_died_status', monsterId: monster.id });
                continue;
            }

            const events = this._resolveMonsterAction(monster, action);
            allEvents.push(...events);

            if (this.player.isDead) {
                this.state = COMBAT_STATE.LOSE;
                break;
            }
        }

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
        const target  = this.monsters[targetIdx] || this.monsters[0];

        // ── Curse Cards ───────────────────────────────────────
        if (card.isCurse) {
            if (card.curseEffect?.damage) {
                this.player.addStatus('curse_burn', card.curseEffect.damage, 999);
                events.push({ type: 'curse_active', curse: 'damage_per_turn' });
            }
            if (card.curseEffect?.hpMaxReduce) {
                const reduction = Math.floor(this.player.stats['hp_max'] * card.curseEffect.hpMaxReduce / 100);
                this.player.stats['hp_max'] = Math.max(10, this.player.stats['hp_max'] - reduction);
                this.player.hp = Math.min(this.player.hp, this.player.stats['hp_max']);
                this.player.addStatus('extra_draw', card.curseBenefit?.extraDraw || 0, 999);
                events.push({ type: 'curse_active', curse: 'hp_max_reduce' });
            }
            if (card.curseEffect?.noHeal) {
                this.player._noHeal = true;
                events.push({ type: 'curse_active', curse: 'no_heal' });
            }
            if (card.curseBenefit?.costReduction) {
                // Simpan sebagai status effect agar persist antar turn dalam combat
                this.player.addStatus('curse_cost', card.curseBenefit.costReduction, 999);
                this.player._curseReduction = (this.player._curseReduction || 0) + card.curseBenefit.costReduction;
                events.push({ type: 'curse_benefit', benefit: 'cost_reduction', value: card.curseBenefit.costReduction });
                this._addLog(`Kutukan! Cost semua kartu -${card.curseBenefit.costReduction}.`);
            }
            if (card.curseBenefit?.damageBonus) {
                this.player._damageBonus = (this.player._damageBonus || 0) + card.curseBenefit.damageBonus;
                events.push({ type: 'curse_benefit', benefit: 'damage_bonus', value: card.curseBenefit.damageBonus });
            }
        }

        // ── Pengorbanan ───────────────────────────────────────
        if (card.sacrificeCard && this.player.hand.length > 0) {
            const idx = Math.floor(Math.random() * this.player.hand.length);
            const sacrificed = this.player.hand.splice(idx, 1)[0];
            this.player.discard.push(sacrificed);
            this.player._nextCardFree = true;
            events.push({ type: 'sacrifice', cardName: sacrificed.name });
        }

        // ── Heal ──────────────────────────────────────────────
        if (card.heal && !this.player._noHeal) {
            const healed = this.player.heal(card.heal);
            events.push({ type: 'heal', amount: healed });
        }

        // ── Last Stand ────────────────────────────────────────
        if (card.lastStand) {
            const hpPct = (this.player.hp / this.player.stats['hp_max']) * 100;
            if (hpPct <= 20) {
                const healAmt = Math.floor(this.player.stats['hp_max'] * (card.healPercent / 100));
                if (!this.player._noHeal) this.player.heal(healAmt);
                if (card.gainBlock) this.player.addBlock(card.gainBlock);
                events.push({ type: 'last_stand', heal: healAmt });
            }
        }

        // ── Draw ──────────────────────────────────────────────
        if (card.drawCards) {
            DeckSystem.draw(this.player, card.drawCards);
            events.push({ type: 'draw', count: card.drawCards });
        }

        // ── Recycle Hand ──────────────────────────────────────
        if (card.recycleHand) {
            const count = this.player.hand.length;
            DeckSystem.discardHand(this.player);
            const drawCount = count + (card.recycleBonus || 1);
            DeckSystem.draw(this.player, drawCount);
            events.push({ type: 'recycle', count: drawCount });
        }

        // ── Stance ────────────────────────────────────────────
        if (card.stance) {
            this.player._stance = card.stance;
            events.push({ type: 'stance', stance: card.stance });
        }

        // ── Buff Player — aktif LANGSUNG turn ini ─────────────
        if (card.effects) {
            for (const eff of card.effects) {
                switch (eff.type) {
                    case 'haste':
                        this.player.energy += eff.value;
                        events.push({ type: 'energy_gain', amount: eff.value });
                        this._addLog(`Haste! +${eff.value} energi.`);
                        break;
                    case 'echo':
                        this.player._echoActive = true;
                        events.push({ type: 'buff_player', status: 'echo' });
                        break;
                    case 'focus':
                        this.player._focusActive = eff.value;
                        events.push({ type: 'buff_player', status: 'focus', value: eff.value });
                        break;
                    case 'taiko':
                        this.player._taikoPerCard = eff.value;
                        events.push({ type: 'buff_player', status: 'taiko', value: eff.value });
                        break;
                    case 'fortify':
                        this.player.addStatus('fortify', eff.value, eff.duration);
                        events.push({ type: 'buff_player', status: 'fortify', value: eff.value });
                        break;
                    case 'dodge':
                        this.player.addStatus('dodge', eff.value, eff.duration);
                        events.push({ type: 'dodge_buff', value: eff.value });
                        break;
                    default:
                        // Status lain ke musuh (burn, poison, dll) — ditangani di bawah
                        break;
                }
            }
        }

        // ── Tunda: skip turn ──────────────────────────────────
        if (card.skipTurn) {
            this.player._nextTurnEnergy = (this.player._nextTurnEnergy || 0) + (card.nextTurnEnergy || 0);
            this.player._nextTurnDraw   = (this.player._nextTurnDraw   || 0) + (card.nextTurnDraw   || 0);
            events.push({ type: 'skip_turn' });
            DeckSystem.discardHand(this.player);
            this.turn++;
            this._startEnemyTurn();
            const enemyEvts = this._processEnemyTurn();
            return [...events, ...enemyEvts];
        }

        // ── Damage ────────────────────────────────────────────
        if ((card.damage || card.iaijutsu || card.desperateDmg) && (target || card.targetAll)) {
            const dmgTargets = card.targetAll
                ? this.monsters.filter(m => !m.isDead)
                : [target].filter(Boolean);

            for (const t of dmgTargets) {
                let dmg = card.damage || 0;

                // Scaling dari stat
                if (card.strScaling) dmg += Math.floor((this.player.stats['str'] || 0) * 0.5);
                if (card.intScaling) dmg += Math.floor((this.player.stats['int'] || 0) * 0.6);
                if (card.agiScaling) dmg += Math.floor((this.player.stats['agi'] || 0) * 0.4);

                // Sinergi
                if (card.burnBonus && t.hasStatus('burn')) dmg *= 2;
                if (card.wetBonus  && t.hasStatus('wet'))  dmg *= 2;

                // Desperate
                if (card.desperateDmg) {
                    const missingHp = (this.player.stats['hp_max'] || 100) - this.player.hp;
                    dmg = (card.baseDamage || 5) + Math.floor(missingHp * (card.desperateMultiplier || 1));
                }

                // Iaijutsu
                if (card.iaijutsu) {
                    dmg = this.player.hand.length * (card.iaijutsuMultiplier || 4);
                }

                // Snipe
                if (card.statusBonus && t.statusEffects.length > 0) {
                    dmg *= (card.statusMultiplier || 3);
                }

                // Eksekusi threshold
                if (card.executeThreshold && t.hpPercent * 100 <= card.executeThreshold) {
                    t.hp = 0;
                    events.push({ type: 'execute', target: t.id });
                    const pr = t.checkPhaseTransition?.();
                    if (pr?.triggered) events.push({ type: 'phase_change', monsterId: t.id, announcement: pr.phase.announcement });
                    continue;
                }

                // Focus
                if (this.player._focusActive) {
                    dmg = Math.floor(dmg * (this.player._focusActive >= 2 ? 2 : 1.5));
                    this.player._focusActive = 0;
                }

                // Taiko
                if (this.player._taikoPerCard && this.player._taikoCount > 0) {
                    dmg += this.player._taikoPerCard * this.player._taikoCount;
                }

                // Damage bonus dari curse
                if (this.player._damageBonus) {
                    dmg = Math.floor(dmg * (1 + this.player._damageBonus / 100));
                }

                // Stance attack
                if (this.player._stance === 'attack') dmg = Math.floor(dmg * 1.3);

                // Stance defend kurangi damage?? — tidak, stance defend kurangi damage yang diterima player

                // Multi-hit
                const hits = card.hits || 1;
                let totalDmg = 0;
                for (let i = 0; i < hits; i++) {
                    totalDmg += t.takeDamage(dmg, card.damageType || 'physical');
                }

                // Cek fase setelah damage
                const pr = t.checkPhaseTransition?.();
                if (pr?.triggered) {
                    events.push({ type: 'phase_change', monsterId: t.id, phaseIndex: pr.phaseIndex, announcement: pr.phase.announcement });
                }

                events.push({ type: 'damage', target: t.id, amount: totalDmg, hits, damageType: card.damageType });
                this._addLog(`${t.name} kena ${totalDmg} dmg.`);
            }

            // Iaijutsu: kosongi tangan
            if (card.emptyHand) {
                this.player.discard.push(...this.player.hand);
                this.player.hand = [];
                events.push({ type: 'empty_hand' });
            }
        }

        // ── Block ─────────────────────────────────────────────
        if (card.block) {
            let blockAmt = card.block;
            if (card.strScaling) blockAmt += Math.floor((this.player.stats['str'] || 0) * 0.3);
            if (this.player._stance === 'defend') blockAmt = Math.floor(blockAmt * 2);

            // Balas Budi
            if (card.requiresBlock && this.player.block > 0 && card.bonusDamage && target) {
                const actual = target.takeDamage(card.bonusDamage, 'physical');
                events.push({ type: 'damage', target: target.id, amount: actual, hits: 1 });
            }

            this.player.addBlock(blockAmt);
            this.player._blockPersist = card.blockPersist || false;
            events.push({ type: 'block', amount: blockAmt });
        }

        // ── Status Effects ke musuh ───────────────────────────
        if (card.effects && target) {
            const skipTypes = ['haste', 'echo', 'focus', 'taiko', 'fortify', 'dodge'];
            for (const eff of card.effects) {
                if (skipTypes.includes(eff.type)) continue;

                const statusTargets = card.targetAll
                    ? this.monsters.filter(m => !m.isDead)
                    : [target];

                for (const t of statusTargets) {
                    t.addStatus(eff.type, eff.value, eff.duration);
                    events.push({ type: 'apply_status', target: t.id, status: eff.type, value: eff.value });
                }
            }
        }

        // ── Catalyze ─────────────────────────────────────────
        if (card.catalyze && target) {
            for (const eff of target.statusEffects) eff.value = Math.floor(eff.value * 2);
            events.push({ type: 'catalyze', target: target.id });
        }

        // ── Balas Dendam ──────────────────────────────────────
        if (card.reactDamage && this.player._lastDamageTaken && target) {
            const mult = card.reactMultiplier || 2;
            const dmg  = this.player._lastDamageTaken * mult;
            const actual = target.takeDamage(dmg, 'physical');
            events.push({ type: 'damage', target: target.id, amount: actual, hits: 1 });
            this.player._lastDamageTaken = 0;
        }

        // ── Bakar Kartu ───────────────────────────────────────
        if (card.burnCard && this.player.hand.length > 0) {
            const idx = Math.floor(Math.random() * this.player.hand.length);
            const burned = this.player.hand.splice(idx, 1)[0];
            const gainEnergy = Math.min((burned.cost || 0) + (card.burnCardBonus || 0), 4);
            this.player.energy = Math.min(this.player.energy + gainEnergy, 10);
            this.player.discard.push(burned);
            events.push({ type: 'burn_card', cardName: burned.name, energy: gainEnergy });
        }

        if (this._allMonstersDead()) this.state = COMBAT_STATE.WIN;

        return events;
    }

    // ── Monster Action ────────────────────────────────────────

    _resolveMonsterAction(monster, action) {
        const events = [];

        if (action.type === 'stunned') {
            events.push({ type: 'monster_stunned', monsterId: monster.id });
            return events;
        }

        if (action.type === 'attack') {
            // Cek dodge
            const dodgeStatus = this.player.statusEffects?.find(s => s.type === 'dodge');
            const dodgeChance = (this.player.stats[STAT.DODGE] || 0) + (dodgeStatus?.value || 0);

            if (Math.random() * 100 < dodgeChance) {
                events.push({ type: 'dodge', target: 'player' });

                // Stance flow: dapat 1 energi saat dodge
                if (this.player._stance === 'flow') {
                    this.player.energy = Math.min(this.player.energy + 1, 10);
                    events.push({ type: 'energy_gain', amount: 1 });
                }
                return events;
            }

            let dmg = action.damage || 0;

            // Chill: kurangi damage yang keluar dari musuh
            if (monster.hasStatus('chill')) {
                const chill = monster.statusEffects.find(s => s.type === 'chill');
                dmg = Math.floor(dmg * (1 - (chill.value / 100)));
            }

            // Stance defend: player terima damage lebih sedikit
            if (this.player._stance === 'defend') {
                dmg = Math.floor(dmg * 0.7);
            }

            const actual = this.player.takeDamage(dmg, action.damageType || 'physical');
            this.player._lastDamageTaken = actual;
            events.push({ type: 'damage', target: 'player', amount: actual, source: monster.id });
            this._addLog(`${monster.name} serang player: ${actual} damage.`);
        }

        if (action.type === 'buff') {
            if (action.block) {
                monster.addBlock(action.block);
                events.push({ type: 'monster_block', monsterId: monster.id, amount: action.block });
            }
        }

        if (action.effects) {
            for (const eff of action.effects) {
                this.player.addStatus(eff.type, eff.value, eff.duration);
                events.push({ type: 'apply_status', target: 'player', status: eff.type, value: eff.value });
            }
        }

        return events;
    }

    // ── Status Effect Player ──────────────────────────────────

    _tickPlayerStatus() {
        for (const eff of [...(this.player.statusEffects || [])]) {
            switch (eff.type) {
                case 'burn':
                case 'poison':
                case 'bleed':
                case 'curse_burn':
                    this.player.takeDamage(eff.value, DMG_TYPE.TRUE);
                    this._addLog(`${eff.type}: -${eff.value} HP.`);
                    break;
            }
            if (eff.type !== 'curse_burn' && eff.type !== 'curse_cost' &&
                eff.type !== 'extra_draw' && eff.duration !== 999) {
                eff.duration--;
            }
        }
        // Hapus yang habis (kecuali yang permanen dalam combat)
        this.player.statusEffects = (this.player.statusEffects || []).filter(s =>
            s.duration === 999 || s.duration > 0
        );
    }

    // ── Reset ─────────────────────────────────────────────────

    /**
     * Reset SEMUA buff sementara.
     * Dipanggil saat start combat baru — status effect tidak boleh carry over.
     */
    _resetAllTempBuffs() {
        // Hapus status effect yang bukan permanen dalam combat ini
        // (curse, extra draw, dll hanya berlaku dalam 1 combat)
        this.player.statusEffects = (this.player.statusEffects || []).filter(s =>
            !['curse_burn', 'curse_cost', 'extra_draw', 'damage_bonus',
              'dodge', 'fortify', 'taiko', 'focus', 'echo'].includes(s.type)
        );

        // Reset semua flag sementara
        this.player._curseReduction  = 0;
        this.player._damageBonus     = 0;
        this.player._nextCardFree    = false;
        this.player._echoActive      = false;
        this.player._focusActive     = 0;
        this.player._taikoCount      = 0;
        this.player._taikoPerCard    = 0;
        this.player._noHeal          = false;
        this.player._stance          = 'none';
        this.player._blockPersist    = false;
        this.player._nextTurnEnergy  = 0;
        this.player._nextTurnDraw    = 0;
        this.player._extraDraw       = 0;
        this.player._lastDamageTaken = 0;
        this.player.block            = 0;
        this.player.hand             = [];
    }

    // ── Helpers ───────────────────────────────────────────────

    _allMonstersDead() {
        return this.monsters.every(m => m.isDead);
    }

    _addLog(msg) {
        this.log.push(msg);
        if (this.log.length > 100) this.log.shift();
    }
}