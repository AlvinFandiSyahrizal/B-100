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

        // Selalu set energy dan draw kartu di awal combat
        // terlepas dari siapa yang jalan duluan
        this.player.energy = ENERGY_PER_TURN;
        this.player.block  = 0;
        DeckSystem.draw(this.player, HAND_SIZE);

        if (this.state === COMBAT_STATE.PLAYER_TURN) {
            this._addLog(`── Giliran 1 (Player) ──`);
        } else {
            // Monster duluan — langsung proses giliran musuh
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

    /**
     * Player memainkan satu kartu dari tangan.
     * Dipanggil dari CombatScene saat player klik kartu.
     *
     * @param {number} handIndex  - index kartu di hand
     * @param {number} targetIdx  - index monster target (default 0)
     * @returns {{ success: boolean, events: object[] }}
     */
    playCard(handIndex, targetIdx = 0) {
        if (this.state !== COMBAT_STATE.PLAYER_TURN) {
            return { success: false, events: [] };
        }

        const card = this.player.hand[handIndex];
        if (!card) return { success: false, events: [] };

        if (card.cost > this.player.energy) {
            this._addLog(`Energi tidak cukup untuk ${card.name}!`);
            return { success: false, events: [{ type: 'no_energy' }] };
        }

        // Pakai kartu
        this.player.hand.splice(handIndex, 1);
        this.player.energy -= card.cost;
        this.player.discard.push(card);

        const events = this._resolveCard(card, targetIdx);
        this._addLog(`Player pakai: ${card.name}`);

        // Cek menang
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

    /**
     * Resolve efek sebuah kartu. Kembalikan array events.
     */
    _resolveCard(card, targetIdx) {
        const events = [];
        const target = this.monsters[targetIdx] || this.monsters[0];

        if (!target && card.type !== 'defense' && card.type !== 'support') {
            return events;
        }

        // ── Damage ────────────────────────────────────────────
        if (card.damage) {
            let targets = card.targetAll ? this.monsters.filter(m => !m.isDead) : [target];

            for (const t of targets) {
                let dmg = card.damage;

                // Scaling dari stat primer
                if (card.strScaling) {
                    dmg += Math.floor(this.player.stats[STAT.STR] * 0.5);
                }
                if (card.intScaling) {
                    dmg += Math.floor(this.player.stats[STAT.INT] * 0.6);
                }
                if (card.agiScaling) {
                    dmg += Math.floor(this.player.stats[STAT.AGI] * 0.4);
                }

                // Sinergi Burn
                if (card.burnBonus && t.hasStatus(STATUS.BURN)) {
                    dmg *= 2;
                }

                // Multi-hit (tikam cepat)
                const hits = card.hits || 1;
                let totalDmg = 0;
                for (let i = 0; i < hits; i++) {
                    const actual = t.takeDamage(dmg, card.damageType);
                    totalDmg += actual;
                }

                events.push({
                    type:    'damage',
                    target:  t.id,
                    amount:  totalDmg,
                    hits:    hits,
                    damageType: card.damageType,
                });

                this._addLog(`${t.name} kena ${totalDmg} damage (${card.damageType}).`);
            }
        }

        // ── Block ─────────────────────────────────────────────
        if (card.block) {
            let blockAmt = card.block;
            if (card.strScaling) blockAmt += Math.floor(this.player.stats[STAT.STR] * 0.3);

            // Balas Budi: kalau ada block aktif, tambah damage ke musuh
            if (card.requiresBlock && this.player.block > 0 && card.bonusDamage && target) {
                const actual = target.takeDamage(card.bonusDamage, DMG_TYPE.PHYSICAL);
                events.push({ type: 'damage', target: target.id, amount: actual, hits: 1 });
                this._addLog(`Balas Budi! ${target.name} kena ${actual} damage.`);
            }

            this.player.addBlock(blockAmt);
            this.player._blockPersist = card.blockPersist || false;
            events.push({ type: 'block', amount: blockAmt });
            this._addLog(`Player dapat Block ${blockAmt}.`);
        }

        // ── Status Effects ke musuh ───────────────────────────
        if (card.effects && card.effects.length > 0 && target) {
            for (const effect of card.effects) {
                target.addStatus(effect.type, effect.value, effect.duration);
                events.push({
                    type:     'apply_status',
                    target:   target.id,
                    status:   effect.type,
                    value:    effect.value,
                    duration: effect.duration,
                });
                this._addLog(`${target.name} kena ${effect.type} ${effect.value} (${effect.duration} giliran).`);
            }
        }

        // ── Dodge (langkah bayangan) ──────────────────────────
        if (card.effects) {
            const dodgeEffect = card.effects.find(e => e.type === STATUS.DODGE);
            if (dodgeEffect) {
                this.player.addStatus(STATUS.DODGE, dodgeEffect.value, dodgeEffect.duration);
                events.push({ type: 'dodge_buff', value: dodgeEffect.value });
                this._addLog(`Player dapat Dodge +${dodgeEffect.value}% untuk ${dodgeEffect.duration} giliran.`);
            }
        }

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
            const dodgeStatus = this.player.statusEffects?.find(s => s.type === STATUS.DODGE);
            const dodgeChance = (this.player.stats[STAT.DODGE] || 0) + (dodgeStatus?.value || 0);

            if (Math.random() * 100 < dodgeChance) {
                events.push({ type: 'dodge', target: 'player' });
                this._addLog(`Player dodge serangan ${monster.name}!`);
                return events;
            }

            let dmg    = action.damage || 0;
            const actual = this.player.takeDamage(dmg, action.damageType || DMG_TYPE.PHYSICAL);
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