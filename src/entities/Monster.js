// ============================================================
// Monster.js — class monster
// Data monster ada di data/monsters/, class ini yang jalankan logikanya
// ============================================================

import { STAT, DMG_TYPE, MONSTER_SCALE_PER_FLOOR } from '../config/constants.js';

export class Monster {
    /**
     * @param {object} data   - data monster dari data/monsters/
     * @param {number} floor  - lantai saat ini, untuk scaling
     */
    constructor(data, floor = 1) {
        this.id          = data.id;
        this.name        = data.name;
        this.description = data.description || '';
        this.zone        = data.zone || 1;
        this.spriteKey   = data.spriteKey || 'monster_basic';

        // ── Scaling stat berdasarkan lantai ───────────────────
        const scale = 1 + (floor - 1) * MONSTER_SCALE_PER_FLOOR;

        this.maxHP = Math.round(data.baseHP * scale);
        this.hp    = this.maxHP;

        this.stats = {
            [STAT.STR]:  Math.round((data.stats?.str  || 5) * scale),
            [STAT.INT]:  Math.round((data.stats?.int  || 3) * scale),
            [STAT.AGI]:  Math.round((data.stats?.agi  || 4) * scale),
            [STAT.DEF]:  Math.round((data.stats?.def  || 2) * scale),
            [STAT.MDEF]: Math.round((data.stats?.mdef || 1) * scale),
        };

        // ── Attack Pattern ────────────────────────────────────
        // Array of { type, value, intent } — intent yang ditampilkan ke player
        this.attackPattern = data.attackPattern || [
            { type: 'attack', damage: 8, damageType: DMG_TYPE.PHYSICAL, intent: 'attack' }
        ];
        this.patternIndex = 0;  // giliran mana sekarang

        // ── Status Effects ────────────────────────────────────
        this.statusEffects = [];
        this.block         = 0;

        // ── Loot ──────────────────────────────────────────────
        this.lootTable = data.lootTable || { gold: [5, 15], items: [] };

        // ── State ─────────────────────────────────────────────
        this.isStunned = false;
    }

    // ── Intent (apa yang mau dilakukan giliran ini) ───────────

    /** Kembalikan action berikutnya, TANPA menjalankannya. */
    get currentIntent() {
        return this.attackPattern[this.patternIndex % this.attackPattern.length];
    }

    /** Jalankan action dan advance pattern. Kembalikan action yang dijalankan. */
    executeAction() {
        if (this.isStunned) {
            this.isStunned = false;
            this._tickStatusEffects();
            return { type: 'stunned', intent: 'stunned' };
        }

        const action = this.currentIntent;
        this.patternIndex = (this.patternIndex + 1) % this.attackPattern.length;
        this._tickStatusEffects();
        return action;
    }

    // ── HP / Damage / Heal ────────────────────────────────────

    takeDamage(amount, type = 'physical') {
        let actual = amount;

        if (type === DMG_TYPE.PHYSICAL) {
            actual = Math.max(0, amount - this.stats[STAT.DEF]);
        } else if (type === DMG_TYPE.MAGIC) {
            actual = Math.max(0, amount - this.stats[STAT.MDEF]);
        }

        if (this.block > 0) {
            const blocked = Math.min(this.block, actual);
            this.block  -= blocked;
            actual      -= blocked;
        }

        this.hp = Math.max(0, this.hp - actual);
        return actual;
    }

    heal(amount) {
        const before = this.hp;
        this.hp = Math.min(this.maxHP, this.hp + amount);
        return this.hp - before;
    }

    addBlock(amount) {
        this.block += amount;
    }

    get isDead() {
        return this.hp <= 0;
    }

    get hpPercent() {
        return this.hp / this.maxHP;
    }

    // ── Status Effects ────────────────────────────────────────

    addStatus(type, value, duration) {
        const existing = this.statusEffects.find(s => s.type === type);
        if (existing) {
            existing.value    += value;    // status monster biasanya stack
            existing.duration = Math.max(existing.duration, duration);
        } else {
            this.statusEffects.push({ type, value, duration });
        }
    }

    hasStatus(type) {
        return this.statusEffects.some(s => s.type === type);
    }

    _tickStatusEffects() {
        for (const effect of [...this.statusEffects]) {
            switch (effect.type) {
                case 'burn':
                case 'poison':
                case 'bleed':
                    this.hp = Math.max(0, this.hp - effect.value);
                    break;
                case 'stun':
                    this.isStunned = true;
                    break;
            }
            effect.duration--;
        }
        this.statusEffects = this.statusEffects.filter(s => s.duration > 0);
    }
}
