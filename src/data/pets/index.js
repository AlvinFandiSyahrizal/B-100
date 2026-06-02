// ============================================================
// data/pets/index.js — data semua pet
// Pet kasih passive buff permanen selama run
// Phase 3: semua pet dari roster lengkap
// ============================================================

export const PETS = {

    // ── COMMON ────────────────────────────────────────────────

    kucing_calico: {
        id:          'kucing_calico',
        name:        'Kucing Calico',
        rarity:      'common',
        element:     'kodama',
        description: '+5% gold dari semua combat.',
        flavorText:  '"Hoki selalu mengikuti kucing tiga warna."',
        passives: [
            { type: 'gold_bonus', value: 5 },
        ],
    },

    tikus_putih: {
        id:          'tikus_putih',
        name:        'Tikus Putih',
        rarity:      'common',
        element:     'ryuu',
        description: '+1 kartu di hand awal setiap combat.',
        flavorText:  '"Kecil tapi selalu siap."',
        passives: [
            { type: 'card_draw', value: 1 },
        ],
    },

    burung_gagak: {
        id:          'burung_gagak',
        name:        'Burung Gagak',
        rarity:      'common',
        element:     'tsuki',
        description: 'Lihat intent musuh dari turn pertama.',
        flavorText:  '"Gagak tahu apa yang akan terjadi sebelum kamu tahu."',
        passives: [
            { type: 'see_intent' },
        ],
    },

    // ── RARE ──────────────────────────────────────────────────

    rubah_kecil: {
        id:          'rubah_kecil',
        name:        'Rubah Kecil',
        rarity:      'rare',
        element:     'ryuu',
        description: '+8 Dodge rate.',
        flavorText:  '"Gerakannya tak terbaca."',
        passives: [
            { type: 'stat_bonus', stat: 'dodge', value: 8 },
        ],
    },

    serigala_abu: {
        id:          'serigala_abu',
        name:        'Serigala Abu',
        rarity:      'rare',
        element:     'oni',
        description: '+10% damage physical.',
        flavorText:  '"Taring yang tak pernah tumpul."',
        passives: [
            { type: 'damage_bonus', damageType: 'physical', value: 10 },
        ],
    },

    kura_kura_tua: {
        id:          'kura_kura_tua',
        name:        'Kura-kura Tua',
        rarity:      'rare',
        element:     'kodama',
        description: '+15 HP max.',
        flavorText:  '"Lambat tapi tidak pernah menyerah."',
        passives: [
            { type: 'stat_bonus', stat: 'hp_max', value: 15 },
        ],
    },

    ular_hijau: {
        id:          'ular_hijau',
        name:        'Ular Hijau',
        rarity:      'rare',
        element:     'kasha',
        description: 'Setiap combat dimulai, semua musuh mendapat Poison 2 (2 giliran).',
        flavorText:  '"Bisanya sudah bekerja sebelum kamu melihatnya."',
        passives: [
            {
                type:   'status_start',
                status: { type: 'poison', value: 2, duration: 2 },
            },
        ],
    },

    // ── ANCIENT ───────────────────────────────────────────────

    nue_kecil: {
        id:          'nue_kecil',
        name:        'Nue Kecil',
        rarity:      'ancient',
        element:     'tsuki',
        description: 'Setiap combat dimulai, 1 musuh acak mendapat debuff random (Burn/Poison/Bleed).',
        flavorText:  '"Makhluk chimera yang membawa kesialan."',
        passives: [],
        passiveFn: (player, context) => {
            if (!player._petStatusStart) player._petStatusStart = [];
            const debuffs = ['burn', 'poison', 'bleed'];
            const picked  = debuffs[Math.floor(Math.random() * debuffs.length)];
            player._petStatusStart.push({ type: picked, value: 4, duration: 2, targetRandom: true });
            return [{ type: 'pet_passive', petId: 'nue_kecil', passiveType: 'status_start_random' }];
        },
    },

    tanuki_bayi: {
        id:          'tanuki_bayi',
        name:        'Tanuki Bayi',
        rarity:      'ancient',
        element:     'ryuu',
        description: 'Harga shop -15%.',
        flavorText:  '"Selalu bisa menawar harga."',
        passives: [
            { type: 'shop_discount', value: 15 },
        ],
    },

    harimau_putih: {
        id:          'harimau_putih',
        name:        'Harimau Putih',
        rarity:      'ancient',
        element:     'taiyo',
        description: '+20% damage saat HP player di bawah 30%.',
        flavorText:  '"Paling berbahaya saat terpojok."',
        passives: [],
        passiveFn: (player, context) => {
            // Flag khusus — dicek di CombatSystem saat damage
            player._petLowHpDamageBonus = 20;
            return [{ type: 'pet_passive', petId: 'harimau_putih', passiveType: 'low_hp_damage_bonus', value: 20 }];
        },
    },

    ubur_ubur_biru: {
        id:          'ubur_ubur_biru',
        name:        'Ubur-ubur Biru',
        rarity:      'ancient',
        element:     'ryuu',
        description: 'Setiap musuh dalam kondisi Wet, damage Raijin +5.',
        flavorText:  '"Air dan petir, kombinasi mematikan."',
        passives: [],
        passiveFn: (player, context) => {
            player._petWetRaijinBonus = 5;
            return [{ type: 'pet_passive', petId: 'ubur_ubur_biru', passiveType: 'wet_raijin_bonus', value: 5 }];
        },
    },

    // ── MYTHIC ────────────────────────────────────────────────

    naga_api_bayi: {
        id:          'naga_api_bayi',
        name:        'Naga Api Bayi',
        rarity:      'mythic',
        element:     'kasha',
        description: 'Semua Burn damage +50%.',
        flavorText:  '"Api kecil yang bisa membakar segalanya."',
        passives: [
            { type: 'status_dmg_bonus', status: 'burn', value: 50 },
        ],
    },

    rubah_9_ekor_bayi: {
        id:          'rubah_9_ekor_bayi',
        name:        'Rubah 9 Ekor Bayi',
        rarity:      'mythic',
        element:     'taiyo',
        description: 'Regen 5 HP setiap awal giliran player.',
        flavorText:  '"Setiap ekor membawa berkah sendiri."',
        passives: [
            { type: 'regen', value: 5 },
        ],
    },

    bayi_oni: {
        id:          'bayi_oni',
        name:        'Bayi Oni',
        rarity:      'mythic',
        element:     'oni',
        description: 'Block tidak hilang di akhir giliran player.',
        flavorText:  '"Sekeras batu, setabah batu."',
        passives: [
            { type: 'block_persist' },
        ],
    },

    // ── DIVINE ────────────────────────────────────────────────

    feniks_kecil: {
        id:          'feniks_kecil',
        name:        'Feniks Kecil',
        rarity:      'divine',
        element:     'taiyo',
        description: 'Sekali per run: bangkit dengan 30% HP saat HP menyentuh 0.',
        flavorText:  '"Dari abu, lahir kembali."',
        passives: [],
        passiveFn: (player, context) => {
            if (!player._petFeniks) {
                player._petFeniks = true;   // flag — dicek di CombatSystem saat player mati
            }
            return [{ type: 'pet_passive', petId: 'feniks_kecil', passiveType: 'revive' }];
        },
    },

    naga_langit_bayi: {
        id:          'naga_langit_bayi',
        name:        'Naga Langit Bayi',
        rarity:      'divine',
        element:     'ryuu',
        description: 'Semua elemen damage +20%.',
        flavorText:  '"Penguasa semua elemen."',
        passives: [
            { type: 'damage_bonus', damageType: 'all', value: 20 },
        ],
    },
};

// ── Exports ───────────────────────────────────────────────────

export function getPet(id)    { return PETS[id] || null; }
export function getAllPets()  { return Object.values(PETS); }

export const STARTER_PETS = ['kucing_calico', 'tikus_putih', 'burung_gagak'];