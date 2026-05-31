// ============================================================
// systems/ElementSystem.js — Sistem Tipe Gogyō
//
// 5 elemen dalam lingkaran saling mengalahkan:
//   Ryuu → Kasha → Kodama → Oni → Raijin → Ryuu
//
// 2 elemen special yang hanya saling mengalahkan satu sama lain:
//   Taiyo ↔ Tsuki  (x2.5 satu sama lain, kebal terhadap 5 elemen lain)
//
// Multiplier:
//   Unggul    → x1.5  (elemen menyerang elemen yang lemah)
//   Normal    → x1.0
//   Lemah     → x0.75 (elemen menyerang elemen yang kuat dari dia)
//   Taiyo vs Tsuki / Tsuki vs Taiyo → x2.5
//   Taiyo/Tsuki vs elemen lain → x1.0 (netral, tidak ada bonus/penalti)
// ============================================================

export const ELEMENT = {
    RYUU:   'ryuu',     // naga / air
    KASHA:  'kasha',    // api yokai
    KODAMA: 'kodama',   // hutan / alam
    ONI:    'oni',      // tanah / kekuatan
    RAIJIN: 'raijin',   // petir / angin
    TAIYO:  'taiyo',    // cahaya / matahari
    TSUKI:  'tsuki',    // kegelapan / bulan
};

// Lingkaran Gogyō: STRONG_AGAINST[A] = B berarti A mengalahkan B
const STRONG_AGAINST = {
    [ELEMENT.RYUU]:   ELEMENT.KASHA,   // air padamkan api
    [ELEMENT.KASHA]:  ELEMENT.KODAMA,  // api bakar hutan
    [ELEMENT.KODAMA]: ELEMENT.ONI,     // akar tembus tanah
    [ELEMENT.ONI]:    ELEMENT.RAIJIN,  // tanah serap petir
    [ELEMENT.RAIJIN]: ELEMENT.RYUU,    // petir pukul air/naga
    // Taiyo & Tsuki tidak masuk lingkaran
};

// Kebalikan: WEAK_AGAINST[A] = B berarti A lemah terhadap B
const WEAK_AGAINST = {};
for (const [attacker, defender] of Object.entries(STRONG_AGAINST)) {
    WEAK_AGAINST[defender] = attacker;
}

// Multiplier
const MULT_STRONG   = 1.5;
const MULT_WEAK     = 0.75;
const MULT_NEUTRAL  = 1.0;
const MULT_DIVINE   = 2.5;   // Taiyo ↔ Tsuki

export class ElementSystem {

    /**
     * Hitung multiplier damage berdasarkan elemen penyerang vs elemen target.
     *
     * @param {string} attackerElement  — elemen weapon/companion/kartu
     * @param {string} defenderElement  — elemen monster
     * @returns {number} multiplier (0.75 / 1.0 / 1.5 / 2.5)
     */
    static getMultiplier(attackerElement, defenderElement) {
        if (!attackerElement || !defenderElement) return MULT_NEUTRAL;

        const atk = attackerElement.toLowerCase();
        const def = defenderElement.toLowerCase();

        if (atk === def) return MULT_NEUTRAL;

        // Taiyo vs Tsuki dan sebaliknya
        if ((atk === ELEMENT.TAIYO && def === ELEMENT.TSUKI) ||
            (atk === ELEMENT.TSUKI && def === ELEMENT.TAIYO)) {
            return MULT_DIVINE;
        }

        // Taiyo/Tsuki vs elemen biasa → netral
        if (atk === ELEMENT.TAIYO || atk === ELEMENT.TSUKI) return MULT_NEUTRAL;
        if (def === ELEMENT.TAIYO || def === ELEMENT.TSUKI) return MULT_NEUTRAL;

        // Lingkaran Gogyō
        if (STRONG_AGAINST[atk] === def) return MULT_STRONG;
        if (WEAK_AGAINST[atk]   === def) return MULT_WEAK;

        return MULT_NEUTRAL;
    }

    /**
     * Terapkan multiplier elemen ke damage.
     *
     * @param {number} baseDamage
     * @param {string} attackerElement
     * @param {string} defenderElement
     * @returns {{ finalDamage: number, multiplier: number, reaction: string }}
     */
    static applyElement(baseDamage, attackerElement, defenderElement) {
        const multiplier    = this.getMultiplier(attackerElement, defenderElement);
        const finalDamage   = Math.round(baseDamage * multiplier);
        const reaction      = this.getReactionLabel(multiplier);

        return { finalDamage, multiplier, reaction };
    }

    /**
     * Label reaksi untuk ditampilkan di UI (DamageNumber).
     */
    static getReactionLabel(multiplier) {
        if (multiplier >= 2.5) return 'divine';    // ✦ Divine!
        if (multiplier >= 1.5) return 'strong';    // ▲ Efektif!
        if (multiplier <= 0.75) return 'weak';     // ▼ Tidak Efektif
        return 'neutral';
    }

    /**
     * Cek apakah dua elemen saling berinteraksi (bukan netral).
     */
    static hasInteraction(attackerElement, defenderElement) {
        return this.getMultiplier(attackerElement, defenderElement) !== MULT_NEUTRAL;
    }

    /**
     * Dapatkan elemen yang kuat terhadap elemen tertentu.
     * Berguna untuk hint UI / AI.
     */
    static getStrongAgainst(element) {
        return STRONG_AGAINST[element] || null;
    }

    static getWeakAgainst(element) {
        return WEAK_AGAINST[element] || null;
    }

    /**
     * Dapatkan warna hex untuk elemen (untuk UI badge).
     */
    static getElementColor(element) {
        const colors = {
            [ELEMENT.RYUU]:   0x3388cc,
            [ELEMENT.KASHA]:  0xff6600,
            [ELEMENT.KODAMA]: 0x44aa44,
            [ELEMENT.ONI]:    0xcc4422,
            [ELEMENT.RAIJIN]: 0x55aaff,
            [ELEMENT.TAIYO]:  0xffcc33,
            [ELEMENT.TSUKI]:  0x8844cc,
        };
        return colors[element?.toLowerCase()] ?? 0x888888;
    }

    /**
     * Dapatkan icon string untuk elemen.
     */
    static getElementIcon(element) {
        const icons = {
            [ELEMENT.RYUU]:   '🐉',
            [ELEMENT.KASHA]:  '🔥',
            [ELEMENT.KODAMA]: '🌿',
            [ELEMENT.ONI]:    '👹',
            [ELEMENT.RAIJIN]: '⚡',
            [ELEMENT.TAIYO]:  '☀',
            [ELEMENT.TSUKI]:  '🌑',
        };
        return icons[element?.toLowerCase()] ?? '●';
    }

    /**
     * Kembalikan semua relasi elemen untuk ditampilkan di UI tips.
     * Format: [{ from, to, type: 'strong'|'divine' }]
     */
    static getAllRelations() {
        const relations = [];

        for (const [atk, def] of Object.entries(STRONG_AGAINST)) {
            relations.push({ from: atk, to: def, type: 'strong' });
        }

        relations.push({ from: ELEMENT.TAIYO, to: ELEMENT.TSUKI, type: 'divine' });
        relations.push({ from: ELEMENT.TSUKI, to: ELEMENT.TAIYO, type: 'divine' });

        return relations;
    }
}