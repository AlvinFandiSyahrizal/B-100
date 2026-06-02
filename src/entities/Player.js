// ============================================================
// Player.js — class karakter utama yang dikendalikan player
// Update Phase 3: tambah pet, companions, ownedPets
// ============================================================

import {
    EQUIP_SLOT,
    ENERGY_PER_TURN, HAND_SIZE
} from '../config/constants.js';

export class Player {
    constructor({ name = 'Samurai Tanpa Nama', curseLevel = 1 } = {}) {
        this.name       = name;
        this.curseLevel = curseLevel;

        this.baseStats = {
            str: 10,
            int: 8,
            agi: 9,
        };

        this.equipment = {
            [EQUIP_SLOT.WEAPON]:    null,
            [EQUIP_SLOT.KABUTO]:    null,
            [EQUIP_SLOT.DO]:        null,
            [EQUIP_SLOT.KOTE]:      null,
            [EQUIP_SLOT.SUNEATE]:   null,
            [EQUIP_SLOT.ACCESSORY]: null,
        };

        this.stats = this._calculateStats();

        this.hp = this.stats['hp_max'];
        this.mp = this.stats['mp_max'];

        this.level = 1;
        this.exp   = 0;
        this.gold  = 0;

        this.deck    = [];
        this.hand    = [];
        this.discard = [];

        this.energy    = 0;
        this.maxEnergy = ENERGY_PER_TURN;

        this.statusEffects = [];
        this.block         = 0;

        // ── Phase 3: Companion, Pet, Owned collection ─────────
        this.companions = [];       // array { id, mode } — maks 2 slot
        this.pet        = null;     // string id pet aktif, atau null
        this.ownedPets  = [];       // array id pet yang dimiliki player
    }

    // ── Stat Calculation ──────────────────────────────────────

    _calculateStats() {
        const s    = this.baseStats;
        const gear = this.equipment || {};

        let bonus = {
            hp: 0, mp: 0,
            str: 0, int: 0, agi: 0,
            def: 0, mdef: 0,
            hit: 0, dodge: 0,
            crit: 0, crit_dmg: 0,
        };

        for (const item of Object.values(gear)) {
            if (!item?.statBonus) continue;
            for (const [key, val] of Object.entries(item.statBonus)) {
                if (bonus[key] !== undefined) bonus[key] += val;
            }
        }

        const str = (s.str || 10) + bonus.str;
        const int = (s.int || 8)  + bonus.int;
        const agi = (s.agi || 9)  + bonus.agi;

        return {
            str, int, agi,
            hp_max:   80  + str * 8  + bonus.hp,
            mp_max:   30  + int * 5  + bonus.mp,
            def:      Math.floor(str * 0.5) + bonus.def,
            mdef:     Math.floor(int * 0.5) + bonus.mdef,
            hit:      90  + Math.floor(agi * 0.3) + bonus.hit,
            dodge:    Math.floor(agi * 1.2) + bonus.dodge,
            crit:     5   + Math.floor(agi * 0.8) + bonus.crit,
            crit_dmg: 150 + Math.floor((str + int) * 0.5) + bonus.crit_dmg,
        };
    }

    // ── Combat ────────────────────────────────────────────────

    drawCards(count = HAND_SIZE) {
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) this.reshuffleDiscard();
            if (this.deck.length === 0) break;
            this.hand.push(this.deck.pop());
        }
    }

    reshuffleDiscard() {
        this.deck    = [...this.discard];
        this.discard = [];
        this._shuffle(this.deck);
    }

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    playCard(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.hand.length) return null;
        const card = this.hand.splice(cardIndex, 1)[0];
        this.energy -= card.cost;
        this.discard.push(card);
        return card;
    }

    discardHand() {
        this.discard.push(...this.hand);
        this.hand = [];
    }

    startTurn() {
        this.energy = this.maxEnergy;
        this.block  = 0;
        this.drawCards(HAND_SIZE);
        this._tickStatusEffects();
    }

    endTurn() { this.discardHand(); }

    // ── HP / Damage / Heal ────────────────────────────────────

    takeDamage(amount, type = 'physical') {
        let actual = amount;
        if (type === 'physical') actual = Math.max(0, amount - (this.stats['def']  || 0));
        else if (type === 'magic') actual = Math.max(0, amount - (this.stats['mdef'] || 0));
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
        this.hp = Math.min(this.stats['hp_max'], this.hp + amount);
        return this.hp - before;
    }

    addBlock(amount) { this.block += amount; }

    get isDead() { return this.hp <= 0; }

    // ── Status Effects ────────────────────────────────────────

    addStatus(type, value, duration) {
        const existing = this.statusEffects.find(s => s.type === type);
        if (existing) {
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

    _tickStatusEffects() {
        for (const eff of [...this.statusEffects]) {
            if (['burn', 'poison', 'bleed'].includes(eff.type)) {
                this.hp = Math.max(0, this.hp - eff.value);
            }
            eff.duration--;
        }
        this.statusEffects = this.statusEffects.filter(s => s.duration > 0);
    }

    // ── Equipment ─────────────────────────────────────────────

    equip(item) {
        const old = this.equipment[item.slot];
        this.equipment[item.slot] = item;
        this.stats = this._calculateStats();
        this.hp    = Math.min(this.hp, this.stats['hp_max']);
        return old;
    }

    unequip(slot) {
        const item = this.equipment[slot];
        this.equipment[slot] = null;
        this.stats = this._calculateStats();
        this.hp    = Math.min(this.hp, this.stats['hp_max']);
        return item;
    }

    // ── Deck Management ───────────────────────────────────────

    addCardToDeck(card) { this.deck.push(card); }

    removeCardFromDeck(id) {
        const idx = this.deck.findIndex(c => c.id === id);
        if (idx !== -1) this.deck.splice(idx, 1);
    }

    initStarterDeck(cards) {
        this.deck = [...cards];
        this._shuffle(this.deck);
    }

    get deckSize() {
        return this.deck.length + this.hand.length + this.discard.length;
    }

    // ── Serialization ─────────────────────────────────────────

    toJSON() {
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
            deck:          allCards,
            discard:       [],
            hand:          [],
            statusEffects: this.statusEffects,
            block:         this.block,
            // ── Phase 3 ───────────────────────────────────────
            companions:    this.companions  || [],
            pet:           this.pet         || null,
            ownedPets:     this.ownedPets   || [],
        };
    }

    static fromJSON(data) {
        const p = new Player({ name: data.name, curseLevel: data.curseLevel });
        Object.assign(p.baseStats, data.baseStats);
        p.equipment     = data.equipment     || {};
        p.stats         = p._calculateStats();
        p.hp            = Number(data.hp)    || p.stats['hp_max'];
        p.mp            = Number(data.mp)    || p.stats['mp_max'];
        p.level         = Number(data.level) || 1;
        p.exp           = Number(data.exp)   || 0;
        p.gold          = Number(data.gold)  || 0;
        p.deck          = data.deck          || [];
        p.discard       = data.discard       || [];
        p.hand          = data.hand          || [];
        p.statusEffects = data.statusEffects || [];
        p.block         = Number(data.block) || 0;
        // ── Phase 3 ───────────────────────────────────────────
        p.companions    = data.companions    || [];
        p.pet           = data.pet           || null;
        p.ownedPets     = data.ownedPets     || [];
        return p;
    }
}