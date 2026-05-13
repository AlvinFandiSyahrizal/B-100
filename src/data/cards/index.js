// ============================================================
// data/cards/index.js — export semua kartu dalam satu objek
// Import dari sini, bukan dari file individual
// ============================================================

import { ATTACK_CARDS }  from './attack_cards.js';
import { DEFENSE_CARDS } from './defense_cards.js';
import { MAGIC_CARDS }   from './magic_cards.js';
// Phase berikutnya tambah:
// import { SUPPORT_CARDS } from './support_cards.js';
// import { SPECIAL_CARDS } from './special_cards.js';

export const ALL_CARDS = {
    ...ATTACK_CARDS,
    ...DEFENSE_CARDS,
    ...MAGIC_CARDS,
};

/** Ambil kartu berdasarkan ID. */
export function getCard(id) {
    const card = ALL_CARDS[id];
    if (!card) console.warn(`[Cards] Kartu tidak ditemukan: "${id}"`);
    return card || null;
}

/** Ambil semua kartu sebagai array. */
export function getAllCardsArray() {
    return Object.values(ALL_CARDS);
}

/** Kartu starter default untuk MC. */
export const STARTER_DECK = [
    // 4x Tebas Biasa
    'tebas_biasa', 'tebas_biasa', 'tebas_biasa', 'tebas_biasa',
    // 2x Tikam Cepat
    'tikam_cepat', 'tikam_cepat',
    // 3x Kuda-Kuda
    'kuda_kuda', 'kuda_kuda', 'kuda_kuda',
    // 1x Ofuda Racun
    'ofuda_racun',
];
// Total 10 kartu — sesuai MIN_DECK_SIZE
