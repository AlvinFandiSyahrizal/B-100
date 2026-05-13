// ============================================================
// attack_cards.js — kartu tipe serangan
// Tambah kartu baru cukup tambah entry baru di sini
// Engine CombatSystem yang baca dan jalankan efeknya
// ============================================================

import { CARD_TYPE, DMG_TYPE, STATUS } from '../../config/constants.js';

export const ATTACK_CARDS = {

    // ── Dasar ─────────────────────────────────────────────────

    tebas_biasa: {
        id:          'tebas_biasa',
        name:        'Tebas Biasa',
        type:        CARD_TYPE.ATTACK,
        cost:        1,
        damage:      8,
        damageType:  DMG_TYPE.PHYSICAL,
        effects:     [],
        upgradedId:  'tebas_tajam',
        spriteKey:   'card_attack',
        description: 'Tebas musuh dengan damage fisik kecil.',
        flavorText:  '"Serangan dasar, tapi mematikan di tangan yang tepat."',
    },

    tebas_tajam: {
        id:          'tebas_tajam',
        name:        'Tebas Tajam',
        type:        CARD_TYPE.ATTACK,
        cost:        1,
        damage:      12,
        damageType:  DMG_TYPE.PHYSICAL,
        effects:     [],
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Tebas dengan bilah yang diasah sempurna. Damage +50%.',
        flavorText:  '"Ketajaman adalah kesabaran yang terakumulasi."',
    },

    tebas_putar: {
        id:          'tebas_putar',
        name:        'Tebas Putar',
        type:        CARD_TYPE.ATTACK,
        cost:        2,
        damage:      12,
        damageType:  DMG_TYPE.PHYSICAL,
        effects:     [],
        targetAll:   true,  // mengenai semua musuh
        upgradedId:  'tebas_putar_plus',
        spriteKey:   'card_attack',
        description: 'Berputar dan serang semua musuh sekaligus.',
        flavorText:  '"Ketika satu musuh tidak cukup."',
    },

    tebas_putar_plus: {
        id:          'tebas_putar_plus',
        name:        'Tebas Putar+',
        type:        CARD_TYPE.ATTACK,
        cost:        2,
        damage:      16,
        damageType:  DMG_TYPE.PHYSICAL,
        effects:     [],
        targetAll:   true,
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Berputar lebih kencang, damage lebih tinggi ke semua musuh.',
        flavorText:  '"Angin dari putaran pedang terasa seperti badai kecil."',
    },

    tikam_cepat: {
        id:          'tikam_cepat',
        name:        'Tikam Cepat',
        type:        CARD_TYPE.ATTACK,
        cost:        1,
        damage:      5,
        damageType:  DMG_TYPE.PHYSICAL,
        hits:        2,         // serang 2x
        agiScaling:  true,      // lebih kuat kalau AGI tinggi
        upgradedId:  'tikam_cepat_plus',
        spriteKey:   'card_attack',
        description: 'Serang 2x cepat. Damage meningkat jika AGI tinggi.',
        flavorText:  '"Kecepatan adalah senjata yang tidak bisa diblok."',
    },

    tikam_cepat_plus: {
        id:          'tikam_cepat_plus',
        name:        'Tikam Cepat+',
        type:        CARD_TYPE.ATTACK,
        cost:        1,
        damage:      5,
        damageType:  DMG_TYPE.PHYSICAL,
        hits:        3,         // serang 3x
        agiScaling:  true,
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Serang 3x. Damage meningkat jika AGI tinggi.',
        flavorText:  '"Tiga tikaman secepat satu."',
    },

    // ── Intermediate ──────────────────────────────────────────

    tebasan_berat: {
        id:          'tebasan_berat',
        name:        'Tebasan Berat',
        type:        CARD_TYPE.ATTACK,
        cost:        2,
        damage:      18,
        damageType:  DMG_TYPE.PHYSICAL,
        effects:     [],
        strScaling:  true,  // damage naik kalau STR tinggi
        upgradedId:  'tebasan_berat_plus',
        spriteKey:   'card_attack',
        description: 'Serangan berat yang memanfaatkan kekuatan penuh. Damage meningkat jika STR tinggi.',
        flavorText:  '"Bukan soal kecepatan. Soal tenaga yang dituangkan."',
    },

    tebasan_berat_plus: {
        id:          'tebasan_berat_plus',
        name:        'Tebasan Berat+',
        type:        CARD_TYPE.ATTACK,
        cost:        2,
        damage:      24,
        damageType:  DMG_TYPE.PHYSICAL,
        effects:     [],
        strScaling:  true,
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Tebasan berat yang lebih brutal. Damage jauh meningkat jika STR tinggi.',
        flavorText:  '"Bumi bergetar di bawah langkah ini."',
    },

    tikam_vital: {
        id:          'tikam_vital',
        name:        'Tikam Vital',
        type:        CARD_TYPE.ATTACK,
        cost:        2,
        damage:      15,
        damageType:  DMG_TYPE.PHYSICAL,
        effects:     [{ type: STATUS.BLEED, value: 4, duration: 3 }],
        upgradedId:  'tikam_vital_plus',
        spriteKey:   'card_attack',
        description: 'Tikam titik vital musuh. Menyebabkan Bleed 4 selama 3 giliran.',
        flavorText:  '"Darah adalah jam. Terus menetes, terus menghitung."',
    },

    tikam_vital_plus: {
        id:          'tikam_vital_plus',
        name:        'Tikam Vital+',
        type:        CARD_TYPE.ATTACK,
        cost:        2,
        damage:      15,
        damageType:  DMG_TYPE.PHYSICAL,
        effects:     [{ type: STATUS.BLEED, value: 6, duration: 4 }],
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Tikam titik vital yang lebih dalam. Bleed 6 selama 4 giliran.',
        flavorText:  '"Luka yang tidak kamu lihat adalah luka yang paling berbahaya."',
    },

    // ── Heavy Hitter ──────────────────────────────────────────

    pukulan_baja: {
        id:          'pukulan_baja',
        name:        'Pukulan Baja',
        type:        CARD_TYPE.ATTACK,
        cost:        3,
        damage:      28,
        damageType:  DMG_TYPE.PHYSICAL,
        effects:     [],
        strScaling:  true,
        upgradedId:  'pukulan_baja_plus',
        spriteKey:   'card_attack',
        description: 'Pukulan sekuat baja. Cost 3 tapi damage besar.',
        flavorText:  '"Satu pukulan. Itulah janji seorang samurai."',
    },

    pukulan_baja_plus: {
        id:          'pukulan_baja_plus',
        name:        'Pukulan Baja+',
        type:        CARD_TYPE.ATTACK,
        cost:        3,
        damage:      38,
        damageType:  DMG_TYPE.PHYSICAL,
        effects:     [],
        strScaling:  true,
        isUpgraded:  true,
        spriteKey:   'card_attack',
        description: 'Pukulan lebih keras dari sebelumnya.',
        flavorText:  '"Bahkan batu pun retak."',
    },
};
