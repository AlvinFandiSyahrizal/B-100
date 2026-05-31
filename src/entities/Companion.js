// ============================================================
// entities/Companion.js — class companion semi-auto
// Companion tidak punya deck kartu. Mereka aksi otomatis
// setiap giliran musuh selesai, sebelum player turn dimulai.
//
// Mode:
//   aggressive → prioritas serang musuh
//   defensive  → prioritas block/heal player
//   support    → prioritas buff player / debuff musuh
// ============================================================

import { COMPANION_MODE } from '../config/constants.js';

export class Companion {

    /**
     * @param {object} data — dari companions/index.js
     */
    constructor(data) {
        this.id          = data.id;
        this.name        = data.name;
        this.rarity      = data.rarity      || 'common';
        this.element     = data.element     || 'kodama';
        this.mode        = data.defaultMode || COMPANION_MODE.AGGRESSIVE;

        // Stat dasar
        this.baseAtk     = data.baseAtk     || 8;
        this.baseDef     = data.baseDef     || 0;
        this.baseHeal    = data.baseHeal    || 0;
        this.atkType     = data.atkType     || 'physical';  // 'physical' | 'magic'
        this.aoe         = data.aoe         || false;       // serang semua musuh?

        // HP companion (untuk future — sekarang companion tidak mati)
        this.maxHp       = data.maxHp       || 60;
        this.hp          = this.maxHp;
        this.alive       = true;

        // Ultimate gauge (0-100)
        this.ultiGauge   = 0;
        this.ultiCost    = data.ultiCost    || 80;
        this.ultiData    = data.ulti        || null;

        // Status effects (minimal — companion lebih simpel dari player)
        this.statusEffects = [];
        this.block         = 0;

        // Scaling per turn
        this.scalingAtk  = data.scalingAtk  || 0;   // +X atk per lantai (set dari luar)
        this._turnCount  = 0;

        // Skill unik per companion
        this.passiveDesc = data.passiveDesc || '';
        this.skillDesc   = data.skillDesc   || '';
        this._passive    = data.passive     || null;
        this._skill      = data.skill       || null;
    }

    // ── Core Action ───────────────────────────────────────────

    /**
     * Dipanggil CombatSystem setelah enemy turn selesai.
     * Return { events: [] } — sama seperti resolveMonsterAction.
     *
     * @param {object[]} monsters  — semua monster di combat
     * @param {object}   player    — player instance
     * @returns {{ events: object[] }}
     */
    act(monsters, player) {
        if (!this.alive) return { events: [] };

        this._turnCount++;
        const events = [];

        // Charge ulti gauge setiap aksi
        this.ultiGauge = Math.min(100, this.ultiGauge + 15);

        // Cek ulti dulu
        if (this.ultiGauge >= this.ultiCost && this.ultiData) {
            const ultiEvents = this._doUlti(monsters, player);
            events.push(...ultiEvents);
            this.ultiGauge = 0;
            return { events };
        }

        // Aksi berdasarkan mode
        switch (this.mode) {
            case COMPANION_MODE.AGGRESSIVE:
                events.push(...this._doAttack(monsters, player));
                break;
            case COMPANION_MODE.DEFENSIVE:
                events.push(...this._doDefend(monsters, player));
                break;
            case COMPANION_MODE.SUPPORT:
                events.push(...this._doSupport(monsters, player));
                break;
            default:
                events.push(...this._doAttack(monsters, player));
        }

        // Passive check setiap aksi
        if (this._passive) {
            const passiveEvents = this._passive(this, monsters, player);
            if (passiveEvents?.length) events.push(...passiveEvents);
        }

        return { events };
    }

    // ── Mode Actions ──────────────────────────────────────────

    _doAttack(monsters, player) {
        const events = [];
        const targets = this.aoe
            ? monsters.filter(m => !m.isDead)
            : [this._pickTarget(monsters)].filter(Boolean);

        for (const target of targets) {
            const dmg    = this._calcAtk();
            const actual = target.takeDamage(dmg, this.atkType);
            events.push({
                type:       'companion_damage',
                companionId: this.id,
                target:      target.id,
                amount:      actual,
                damageType:  this.atkType,
            });

            // Apply status dari skill companion
            if (this._skill) {
                const skillEvents = this._skill(this, target, player);
                if (skillEvents?.length) events.push(...skillEvents);
            }
        }

        return events;
    }

    _doDefend(monsters, player) {
        const events = [];

        // Kasih block ke player
        if (this.baseDef > 0) {
            const blockAmt = this.baseDef + Math.floor(this._turnCount * 0.5);
            player.addBlock(blockAmt);
            events.push({
                type:        'companion_block',
                companionId: this.id,
                amount:      blockAmt,
            });
        }

        // Heal player kalau HP di bawah 40%
        if (this.baseHeal > 0) {
            const hpPct = player.hp / (player.stats?.['hp_max'] || 100);
            if (hpPct < 0.4) {
                const healed = player.heal(this.baseHeal);
                events.push({
                    type:        'companion_heal',
                    companionId: this.id,
                    amount:      healed,
                });
            }
        }

        // Kalau tidak ada yang perlu didefend — serang juga
        if (this.baseDef === 0 && this.baseHeal === 0) {
            events.push(...this._doAttack(monsters, player));
        }

        return events;
    }

    _doSupport(monsters, player) {
        const events = [];

        // Heal player
        if (this.baseHeal > 0) {
            const healed = player.heal(this.baseHeal);
            if (healed > 0) {
                events.push({
                    type:        'companion_heal',
                    companionId: this.id,
                    amount:      healed,
                });
            }
        }

        // Debuff musuh paling kuat
        const target = this._pickTarget(monsters);
        if (target && this._skill) {
            const skillEvents = this._skill(this, target, player);
            if (skillEvents?.length) events.push(...skillEvents);
        }

        // Juga serang kalau ada atk
        if (this.baseAtk > 0) {
            events.push(...this._doAttack(monsters, player));
        }

        return events;
    }

    _doUlti(monsters, player) {
        const events = [];
        const ulti   = this.ultiData;

        events.push({
            type:        'companion_ulti',
            companionId: this.id,
            ultiName:    ulti.name || 'Ultimate',
        });

        // Damage ulti
        if (ulti.damage) {
            const targets = ulti.aoe
                ? monsters.filter(m => !m.isDead)
                : [this._pickTarget(monsters)].filter(Boolean);

            for (const t of targets) {
                const actual = t.takeDamage(ulti.damage, ulti.damageType || this.atkType);
                events.push({
                    type:        'companion_damage',
                    companionId: this.id,
                    target:      t.id,
                    amount:      actual,
                    damageType:  ulti.damageType || this.atkType,
                    isUlti:      true,
                });
            }
        }

        // Heal ulti
        if (ulti.heal) {
            const healed = player.heal(ulti.heal);
            events.push({ type: 'companion_heal', companionId: this.id, amount: healed, isUlti: true });
        }

        // Block ulti
        if (ulti.block) {
            player.addBlock(ulti.block);
            events.push({ type: 'companion_block', companionId: this.id, amount: ulti.block, isUlti: true });
        }

        // Status ke semua musuh
        if (ulti.statusAll) {
            for (const t of monsters.filter(m => !m.isDead)) {
                t.addStatus(ulti.statusAll.type, ulti.statusAll.value, ulti.statusAll.duration);
                events.push({ type: 'apply_status', target: t.id, status: ulti.statusAll.type, value: ulti.statusAll.value });
            }
        }

        return events;
    }

    // ── Helpers ───────────────────────────────────────────────

    _calcAtk() {
        return this.baseAtk + this.scalingAtk + Math.floor(this._turnCount * 0.5);
    }

    /**
     * Pilih target: monster dengan HP terendah (untuk finish off).
     * Kalau semua sama, pilih yang pertama hidup.
     */
    _pickTarget(monsters) {
        const alive = monsters.filter(m => !m.isDead);
        if (alive.length === 0) return null;
        return alive.reduce((lowest, m) => m.hp < lowest.hp ? m : lowest, alive[0]);
    }

    // ── Mode Toggle ───────────────────────────────────────────

    setMode(mode) {
        if (Object.values(COMPANION_MODE).includes(mode)) {
            this.mode = mode;
        }
    }

    // ── Status ────────────────────────────────────────────────

    addStatus(type, value, duration) {
        const existing = this.statusEffects.find(s => s.type === type);
        if (existing) {
            existing.value    = Math.max(existing.value, value);
            existing.duration = Math.max(existing.duration, duration);
        } else {
            this.statusEffects.push({ type, value, duration });
        }
    }

    hasStatus(type) {
        return this.statusEffects.some(s => s.type === type);
    }

    // ── Serialization ─────────────────────────────────────────

    toJSON() {
        return {
            id:         this.id,
            hp:         this.hp,
            ultiGauge:  this.ultiGauge,
            mode:       this.mode,
            alive:      this.alive,
        };
    }

    /**
     * Rebuild dari save — perlu data template dari companions/index.js.
     * @param {object} saved   — dari toJSON()
     * @param {object} template — dari getCompanion(id)
     */
    static fromJSON(saved, template) {
        const c        = new Companion(template);
        c.hp           = saved.hp        ?? c.maxHp;
        c.ultiGauge    = saved.ultiGauge ?? 0;
        c.mode         = saved.mode      ?? c.mode;
        c.alive        = saved.alive     ?? true;
        return c;
    }
}