// ============================================================
// Player.js — class karakter utama yang dikendalikan player
// Menyimpan stat, deck, equipment, dan status effect MC
// ============================================================

import {
    STAT, EQUIP_SLOT, RARITY,
    MIN_DECK_SIZE,
    ENERGY_PER_TURN, HAND_SIZE
} from '../config/constants.js';

export class Player {
    /**
     * @param {object} options
     * @param {string} options.name        - nama MC
     * @param {number} options.curseLevel  - 1-5
     */
    constructor({ name = 'Samurai Tanpa Nama', curseLevel = 1 } = {}) {
        this.name       = name;
        this.curseLevel = curseLevel;

        // ── Stat Primer (naik saat level up) ──────────────────
        this.baseStats = {
            [STAT.STR]: 10,
            [STAT.INT]: 8,
            [STAT.AGI]: 9,
        };

        // ── Stat Sekunder (dihitung dari primer + gear) ────────
        // Dipanggil ulang setiap kali gear berubah
        this.stats = this._calculateStats();

        // ── HP & MP (current) ─────────────────────────────────
        this.hp = this.stats[STAT.HP_MAX];
        this.mp = this.stats[STAT.MP_MAX];

        // ── Level ─────────────────────────────────────────────
        this.level = 1;
        this.exp   = 0;

        // ── Gold ──────────────────────────────────────────────
        this.gold = 0;

        // ── Equipment ─────────────────────────────────────────
        // null = slot kosong
        this.equipment = {
            [EQUIP_SLOT.WEAPON]:    null,
            [EQUIP_SLOT.KABUTO]:    null,
            [EQUIP_SLOT.DO]:        null,
            [EQUIP_SLOT.KOTE]:      null,
            [EQUIP_SLOT.SUNEATE]:   null,
            [EQUIP_SLOT.ACCESSORY]: null,
        };

        // ── Deck & Hand ───────────────────────────────────────
        this.deck    = [];  // semua kartu yang dimiliki player
        this.hand    = [];  // kartu di tangan saat ini (max HAND_SIZE)
        this.discard = [];  // kartu yang sudah dipakai

        // ── Energy ────────────────────────────────────────────
        this.energy    = 0;
        this.maxEnergy = ENERGY_PER_TURN;

        // ── Status Effects ────────────────────────────────────
        // Format: { type: string, value: number, duration: number }
        this.statusEffects = [];

        // ── Block (habis di awal giliran) ─────────────────────
        this.block = 0;
    }

    // ── Stat Calculation ──────────────────────────────────────

    /**
     * Hitung stat sekunder dari stat primer + gear yang terpasang.
     * Dipanggil setiap kali equip/unequip item.
     */
    _calculateStats() {
        const s = this.baseStats;
        const gear = this.equipment || {};

        // Kumpulkan bonus dari gear
        let gearBonus = {
            hp: 0, mp: 0, def: 0, mdef: 0,
            hit: 0, dodge: 0, crit: 0, crit_dmg: 0,
        };

        for (const item of Object.values(gear)) {
            if (!item || !item.statBonus) continue;
            for (const [key, val] of Object.entries(item.statBonus)) {
                if (gearBonus[key] !== undefined) gearBonus[key] += val;
            }
        }

        return {
            // Primer diteruskan apa adanya
            [STAT.STR]: s[STAT.STR],
            [STAT.INT]: s[STAT.INT],
            [STAT.AGI]: s[STAT.AGI],

            // HP max = 80 + (STR * 8) + gear bonus
            [STAT.HP_MAX]: 80 + s[STAT.STR] * 8 + gearBonus.hp,

            // MP max = 30 + (INT * 5) + gear bonus
            [STAT.MP_MAX]: 30 + s[STAT.INT] * 5 + gearBonus.mp,

            // DEF dari gear + sedikit dari STR
            [STAT.DEF]:  Math.floor(s[STAT.STR] * 0.5) + gearBonus.def,

            // Magic DEF dari INT + gear
            [STAT.MDEF]: Math.floor(s[STAT.INT] * 0.5) + gearBonus.mdef,

            // Hit rate base 90% + bonus
            [STAT.HIT]:     90 + Math.floor(s[STAT.AGI] * 0.3) + gearBonus.hit,

            // Dodge base dari AGI
            [STAT.DODGE]:   Math.floor(s[STAT.AGI] * 1.2) + gearBonus.dodge,

            // Crit chance base dari AGI
            [STAT.CRIT]:    5 + Math.floor(s[STAT.AGI] * 0.8) + gearBonus.crit,

            // Crit damage (dalam persen, 150 = 150% damage)
            [STAT.CRIT_DMG]: 150 + Math.floor((s[STAT.STR] + s[STAT.INT]) * 0.5) + gearBonus.crit_dmg,
        };
    }

    // ── Combat ────────────────────────────────────────────────

    /** Ambil kartu dari deck ke tangan. */
    drawCards(count = HAND_SIZE) {
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                this.reshuffleDiscard();
            }
            if (this.deck.length === 0) break;  // deck + discard kosong

            const card = this.deck.pop();        // ambil dari atas deck
            this.hand.push(card);
        }
    }

    /** Pindahkan semua discard pile ke deck, lalu shuffle. */
    reshuffleDiscard() {
        this.deck = [...this.discard];
        this.discard = [];
        this._shuffle(this.deck);
    }

    /** Shuffle deck in-place (Fisher-Yates). */
    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    /** Pakai kartu dari tangan ke discard. */
    playCard(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.hand.length) return null;
        const card = this.hand.splice(cardIndex, 1)[0];
        this.energy -= card.cost;
        this.discard.push(card);
        return card;
    }

    /** Buang semua kartu di tangan ke discard (akhir giliran). */
    discardHand() {
        this.discard.push(...this.hand);
        this.hand = [];
    }

    /** Mulai giliran: restore energi, block habis, draw kartu. */
    startTurn() {
        this.energy = this.maxEnergy;
        this.block  = 0;  // block tidak carry over (kecuali ada kartu khusus)
        this.drawCards(HAND_SIZE);
        this._tickStatusEffects();
    }

    /** Akhir giliran: buang sisa kartu. */
    endTurn() {
        this.discardHand();
    }

    // ── HP / Damage / Heal ────────────────────────────────────

    /**
     * Terima damage setelah kalkulasi DEF / block.
     * @param {number} amount   - damage mentah
     * @param {string} type     - 'physical' | 'magic' | 'true'
     * @returns {number}        - actual damage yang kena
     */
    takeDamage(amount, type = 'physical') {
        let actual = amount;

        if (type === 'physical') {
            actual = Math.max(0, amount - this.stats[STAT.DEF]);
        } else if (type === 'magic') {
            actual = Math.max(0, amount - this.stats[STAT.MDEF]);
        }
        // 'true' tidak dikurangi apapun

        // Kurangi block dulu
        if (this.block > 0) {
            const blocked = Math.min(this.block, actual);
            this.block  -= blocked;
            actual      -= blocked;
        }

        this.hp = Math.max(0, this.hp - actual);
        return actual;
    }

    /** Pulihkan HP. */
    heal(amount) {
        const before = this.hp;
        this.hp = Math.min(this.stats[STAT.HP_MAX], this.hp + amount);
        return this.hp - before;  // actual heal
    }

    /** Tambah block. */
    addBlock(amount) {
        this.block += amount;
    }

    get isDead() {
        return this.hp <= 0;
    }

    // ── Status Effects ────────────────────────────────────────

    addStatus(type, value, duration) {
        const existing = this.statusEffects.find(s => s.type === type);
        if (existing) {
            // Stack duration atau value sesuai tipe
            existing.value    = Math.max(existing.value, value);
            existing.duration = Math.max(existing.duration, duration);
        } else {
            this.statusEffects.push({ type, value, duration });
        }
    }

    removeStatus(type) {
        this.statusEffects = this.statusEffects.filter(s => s.type !== type);
    }

    hasStatus(type) {
        return this.statusEffects.some(s => s.type === type);
    }

    /** Proses semua status effect di awal giliran. */
    _tickStatusEffects() {
        for (const effect of [...this.statusEffects]) {
            switch (effect.type) {
                case 'burn':
                    this.hp = Math.max(0, this.hp - effect.value);
                    break;
                case 'poison':
                    this.hp = Math.max(0, this.hp - effect.value);
                    break;
                case 'bleed':
                    this.hp = Math.max(0, this.hp - effect.value);
                    break;
                // 'stun' dan 'freeze' ditangani CombatSystem
            }
            effect.duration--;
        }
        // Hapus yang sudah habis
        this.statusEffects = this.statusEffects.filter(s => s.duration > 0);
    }

    // ── Equipment ─────────────────────────────────────────────

    equip(item) {
        const slot = item.slot;
        const old  = this.equipment[slot];
        this.equipment[slot] = item;
        this.stats = this._calculateStats();

        // Pastikan HP tidak melebihi max baru
        this.hp = Math.min(this.hp, this.stats[STAT.HP_MAX]);
        return old;  // kembalikan item lama (kalau ada)
    }

    unequip(slot) {
        const item = this.equipment[slot];
        this.equipment[slot] = null;
        this.stats = this._calculateStats();
        this.hp = Math.min(this.hp, this.stats[STAT.HP_MAX]);
        return item;
    }

    // ── Deck Management ───────────────────────────────────────

    addCardToDeck(card) {
        this.deck.push(card);
    }

    removeCardFromDeck(cardId) {
        const idx = this.deck.findIndex(c => c.id === cardId);
        if (idx !== -1) this.deck.splice(idx, 1);
    }

    /** Isi deck dengan kartu starter. Dipanggil saat mulai run. */
    initStarterDeck(cards) {
        this.deck = [...cards];
        this._shuffle(this.deck);
    }

    get deckSize() {
        return this.deck.length + this.hand.length + this.discard.length;
    }

    // ── Serialization (untuk SaveSystem) ─────────────────────

    toJSON() {
        // Pindahkan hand ke discard dulu sebelum serialize
        // supaya tidak ada kartu yang hilang saat di-restore
        const allCards = [...this.deck, ...this.hand, ...this.discard];
        return {
            name:          this.name,
            curseLevel:    this.curseLevel,
            baseStats:     this.baseStats,
            hp:            this.hp,
            mp:            this.mp,
            level:         this.level,
            exp:           this.exp,
            gold:          this.gold,
            equipment:     this.equipment,
            deck:          allCards,   // semua kartu digabung, di-reshuffle saat combat berikutnya
            discard:       [],
            hand:          [],
            statusEffects: this.statusEffects,
            block:         this.block,
        };
    }

    static fromJSON(data) {
        const p = new Player({ name: data.name, curseLevel: data.curseLevel });
        Object.assign(p.baseStats, data.baseStats);
        p.stats         = p._calculateStats();  // hitung dulu sebelum assign hp
        p.hp            = Number(data.hp)    || p.stats[STAT.HP_MAX];
        p.mp            = Number(data.mp)    || p.stats[STAT.MP_MAX];
        p.level         = Number(data.level) || 1;
        p.exp           = Number(data.exp)   || 0;
        p.gold          = Number(data.gold)  || 0;
        p.equipment     = data.equipment     || {};
        p.deck          = data.deck          || [];
        p.discard       = data.discard       || [];
        p.hand          = data.hand          || [];
        p.statusEffects = data.statusEffects || [];
        p.block         = Number(data.block) || 0;
        return p;
    }
}