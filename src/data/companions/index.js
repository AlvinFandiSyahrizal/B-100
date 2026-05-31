// ============================================================
// data/companions/index.js — data semua companion
// Phase 3: Samurai Ronin (common) + Kitsune Muda (rare)
// Phase 4+: sisa companion dari roster lengkap
// ============================================================

import { COMPANION_MODE } from '../../config/constants.js';

export const COMPANIONS = {

    // ── COMMON ────────────────────────────────────────────────

    samurai_ronin: {
        id:          'samurai_ronin',
        name:        'Samurai Ronin',
        rarity:      'common',
        element:     'oni',
        defaultMode: COMPANION_MODE.AGGRESSIVE,

        maxHp:    80,
        baseAtk:  12,
        baseDef:  4,
        baseHeal: 0,
        atkType:  'physical',
        aoe:      false,

        ultiCost: 80,
        ulti: {
            name:       'Tebas Beruntun',
            damage:     40,
            aoe:        false,
            damageType: 'physical',
            description: 'Tiga tebasan cepat ke satu target.',
        },

        passiveDesc: 'Setiap 3 giliran, damage +50% untuk 1 aksi.',
        skillDesc:   'Serangan fisik standar. Di mode Defensive, kasih +4 block ke player.',

        // Passive: setiap 3 giliran, damage x1.5
        passive: (self, monsters, player) => {
            if (self._turnCount % 3 === 0) {
                self._nextAtkBonus = Math.floor(self.baseAtk * 0.5);
            }
            return [];
        },

        // Skill: terapkan bleed kecil ke target
        skill: (self, target, player) => {
            if (Math.random() < 0.30) {   // 30% chance
                target.addStatus('bleed', 3, 2);
                return [{ type: 'apply_status', target: target.id, status: 'bleed', value: 3 }];
            }
            return [];
        },
    },

    petani_tua: {
        id:          'petani_tua',
        name:        'Petani Tua',
        rarity:      'common',
        element:     'kodama',
        defaultMode: COMPANION_MODE.DEFENSIVE,

        maxHp:    60,
        baseAtk:  4,
        baseDef:  6,
        baseHeal: 10,
        atkType:  'physical',
        aoe:      false,

        ultiCost: 80,
        ulti: {
            name:        'Berkah Alam',
            heal:        35,
            block:       15,
            description: 'Heal player + kasih block besar.',
        },

        passiveDesc: 'Heal player 10 HP setiap giliran kalau HP player di bawah 40%.',
        skillDesc:   'Prioritas heal + block. Serang kalau player sudah aman.',

        passive: null,
        skill:   null,
    },

    pencuri_kecil: {
        id:          'pencuri_kecil',
        name:        'Pencuri Kecil',
        rarity:      'common',
        element:     'raijin',
        defaultMode: COMPANION_MODE.AGGRESSIVE,

        maxHp:    50,
        baseAtk:  8,
        baseDef:  0,
        baseHeal: 0,
        atkType:  'physical',
        aoe:      false,

        ultiCost: 70,
        ulti: {
            name:       'Tusuk dari Balik',
            damage:     30,
            aoe:        false,
            damageType: 'physical',
            statusAll:  null,
            description: 'Serangan mendadak dengan chance stun.',
        },

        passiveDesc: 'Serang pertama setiap combat punya 50% chance dodge musuh.',
        skillDesc:   '25% chance terapkan poison ke target.',

        passive: null,
        skill: (self, target, player) => {
            if (Math.random() < 0.25) {
                target.addStatus('poison', 4, 3);
                return [{ type: 'apply_status', target: target.id, status: 'poison', value: 4 }];
            }
            return [];
        },
    },

    // ── RARE ──────────────────────────────────────────────────

    kitsune_muda: {
        id:          'kitsune_muda',
        name:        'Kitsune Muda',
        rarity:      'rare',
        element:     'ryuu',
        defaultMode: COMPANION_MODE.SUPPORT,

        maxHp:    65,
        baseAtk:  10,
        baseDef:  0,
        baseHeal: 12,
        atkType:  'magic',
        aoe:      false,

        ultiCost: 75,
        ulti: {
            name:       'Api Rubah',
            damage:     35,
            aoe:        true,           // kena semua musuh
            damageType: 'magic',
            statusAll:  { type: 'burn', value: 6, duration: 3 },
            description: 'Serangan api ke semua musuh + burn 3 giliran.',
        },

        passiveDesc: 'Setiap giliran, player dapat +1 energi tambahan.',
        skillDesc:   'Heal player 12 HP + serang magic. 40% chance terapkan burn.',

        // Passive: +1 energi ke player tiap giliran companion ini aksi
        passive: (self, monsters, player) => {
            if (player.energy !== undefined) {
                player.energy = Math.min(player.energy + 1, 10);
                return [{ type: 'energy_gain', amount: 1 }];
            }
            return [];
        },

        skill: (self, target, player) => {
            if (Math.random() < 0.40) {
                target.addStatus('burn', 5, 2);
                return [{ type: 'apply_status', target: target.id, status: 'burn', value: 5 }];
            }
            return [];
        },
    },

    shinobi_bayangan: {
        id:          'shinobi_bayangan',
        name:        'Shinobi Bayangan',
        rarity:      'rare',
        element:     'raijin',
        defaultMode: COMPANION_MODE.AGGRESSIVE,

        maxHp:    55,
        baseAtk:  15,
        baseDef:  0,
        baseHeal: 0,
        atkType:  'physical',
        aoe:      false,

        ultiCost: 75,
        ulti: {
            name:       'Serbuan Bayangan',
            damage:     50,
            aoe:        false,
            damageType: 'physical',
            description: 'Serangan tunggal sangat kuat + terapkan poison masif.',
        },

        passiveDesc: 'Damage +20% kalau target punya status effect.',
        skillDesc:   '35% chance terapkan poison ke target.',

        passive: (self, monsters, player) => {
            const target = self._pickTarget(monsters);
            if (target?.statusEffects?.length > 0) {
                self._nextAtkBonus = Math.floor(self.baseAtk * 0.2);
            }
            return [];
        },

        skill: (self, target, player) => {
            if (Math.random() < 0.35) {
                target.addStatus('poison', 5, 3);
                return [{ type: 'apply_status', target: target.id, status: 'poison', value: 5 }];
            }
            return [];
        },
    },

    tengu_penjaga: {
        id:          'tengu_penjaga',
        name:        'Tengu Penjaga',
        rarity:      'rare',
        element:     'oni',
        defaultMode: COMPANION_MODE.AGGRESSIVE,

        maxHp:    70,
        baseAtk:  11,
        baseDef:  3,
        baseHeal: 0,
        atkType:  'physical',
        aoe:      false,

        ultiCost: 80,
        ulti: {
            name:       'Angin Sayap',
            damage:     28,
            aoe:        true,
            damageType: 'physical',
            statusAll:  { type: 'chill', value: 30, duration: 2 },
            description: 'Serang semua musuh + terapkan chill.',
        },

        passiveDesc: 'Setiap serang, 20% chance terapkan bleed.',
        skillDesc:   'Serangan fisik standar. AOE di ulti.',

        passive: null,
        skill: (self, target, player) => {
            if (Math.random() < 0.20) {
                target.addStatus('bleed', 4, 2);
                return [{ type: 'apply_status', target: target.id, status: 'bleed', value: 4 }];
            }
            return [];
        },
    },

    biksu_pengembara: {
        id:          'biksu_pengembara',
        name:        'Biksu Pengembara',
        rarity:      'rare',
        element:     'kodama',
        defaultMode: COMPANION_MODE.SUPPORT,

        maxHp:    65,
        baseAtk:  6,
        baseDef:  5,
        baseHeal: 18,
        atkType:  'magic',
        aoe:      false,

        ultiCost: 70,
        ulti: {
            name:       'Mantra Penyucian',
            heal:       50,
            description: 'Heal player besar + bersihkan 1 status negatif.',
        },

        passiveDesc: 'Bersihkan 1 status negatif dari player setiap 4 giliran.',
        skillDesc:   'Prioritas heal. Kalau player sehat, berikan block.',

        passive: (self, monsters, player) => {
            if (self._turnCount % 4 === 0) {
                const negatives = ['burn', 'poison', 'bleed', 'stun', 'freeze', 'curse_burn'];
                const idx = (player.statusEffects || []).findIndex(s => negatives.includes(s.type));
                if (idx !== -1) {
                    const removed = player.statusEffects.splice(idx, 1)[0];
                    return [{ type: 'companion_cleanse', companionId: self.id, status: removed.type }];
                }
            }
            return [];
        },

        skill: null,
    },
};

// ── Exports ───────────────────────────────────────────────────

export function getCompanion(id)      { return COMPANIONS[id] || null; }
export function getAllCompanions()     { return Object.values(COMPANIONS); }

// Companion yang bisa didapat di awal game (CharacterSelectScene)
export const STARTER_COMPANIONS = ['samurai_ronin', 'kitsune_muda'];