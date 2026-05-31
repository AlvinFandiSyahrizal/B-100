// ============================================================
// Monster.js — class monster
// Support multi-fase untuk mini boss dan boss besar
// Update: tambah field element untuk sistem Gogyō
// ============================================================

import { STAT, DMG_TYPE, MONSTER_SCALE_PER_FLOOR } from '../config/constants.js';

export class Monster {
    constructor(data, floor = 1) {
        this.id          = data.id;
        this.name        = data.name;
        this.title       = data.title       || '';
        this.description = data.description || '';
        this.zone        = data.zone        || 1;
        this.isBoss      = data.isBoss      || false;
        this.isMini      = data.isMini      || false;
        this.spriteKey   = data.spriteKey   || 'monster_basic';

        // ── Elemen Gogyō ──────────────────────────────────────
        // Dipakai ElementSystem untuk hitung damage multiplier
        this.element = data.element || 'kodama';

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

        // ── Fase sistem ───────────────────────────────────────
        this.phases          = data.phases || null;
        this.currentPhase    = 0;
        this._phaseTriggered = {};

        this.attackPattern = data.attackPattern || [
            { type: 'attack', damage: 8, damageType: DMG_TYPE.PHYSICAL, intent: 'attack' }
        ];
        this.patternIndex = 0;

        this.statusEffects = [];
        this.block         = 0;
        this.isStunned     = false;

        this.lootTable = data.lootTable || { gold: [5, 15], items: [] };
    }

    // ── Fase Detection ────────────────────────────────────────

    checkPhaseTransition() {
        if (!this.phases || this.phases.length === 0) return null;

        const hpPercent = (this.hp / this.maxHP) * 100;

        for (let i = 0; i < this.phases.length; i++) {
            const phase = this.phases[i];
            if (hpPercent <= phase.hpThreshold && !this._phaseTriggered[i]) {
                this._phaseTriggered[i] = true;
                this.currentPhase       = i + 1;

                if (phase.attackPattern) {
                    this.attackPattern = phase.attackPattern;
                    this.patternIndex  = 0;
                }

                // Fase baru bisa ganti elemen juga (untuk boss)
                if (phase.element) {
                    this.element = phase.element;
                }

                return { triggered: true, phase, phaseIndex: i + 1 };
            }
        }

        return null;
    }

    get currentPhaseName() {
        if (!this.phases || this.currentPhase === 0) return 'Fase 1';
        return `Fase ${this.currentPhase + 1}`;
    }

    // ── Intent ────────────────────────────────────────────────

    get currentIntent() {
        return this.attackPattern[this.patternIndex % this.attackPattern.length];
    }

    executeAction() {
        if (this.isStunned) {
            this.isStunned = false;
            this._tickStatusEffects();
            return { type: 'stunned', intent: 'stunned' };
        }

        const action      = this.currentIntent;
        this.patternIndex = (this.patternIndex + 1) % this.attackPattern.length;
        this._tickStatusEffects();
        return action;
    }

    // ── HP / Damage ───────────────────────────────────────────

    takeDamage(amount, type = 'physical') {
        let actual = amount;

        if (type === DMG_TYPE.PHYSICAL) {
            actual = Math.max(0, amount - this.stats[STAT.DEF]);
        } else if (type === DMG_TYPE.MAGIC) {
            actual = Math.max(0, amount - this.stats[STAT.MDEF]);
        }
        // DMG_TYPE.TRUE → tidak dikurangi DEF/MDEF, langsung kena

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

    addBlock(amount) { this.block += amount; }

    get isDead()    { return this.hp <= 0; }
    get hpPercent() { return this.hp / this.maxHP; }

    // ── Status Effects ────────────────────────────────────────

    addStatus(type, value, duration) {
        const existing = this.statusEffects.find(s => s.type === type);
        if (existing) {
            existing.value    += value;
            existing.duration  = Math.max(existing.duration, duration);
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
                case 'freeze':
                    this.isStunned = true;
                    break;
                case 'chill':
                    // Ditangani di CombatSystem saat kalkulasi damage
                    break;
            }
            effect.duration--;
        }
        this.statusEffects = this.statusEffects.filter(s => s.duration > 0);
    }
}