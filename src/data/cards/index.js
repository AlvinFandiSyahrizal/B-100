// ============================================================
// data/cards/index.js — export semua kartu dalam satu objek
// Import dari sini, bukan dari file individual
// ============================================================

import { ATTACK_CARDS }  from './attack_cards.js';
import { DEFENSE_CARDS } from './defense_cards.js';
import { MAGIC_CARDS }   from './magic_cards.js';
import { SUPPORT_CARDS } from './support_cards.js';
import { SPECIAL_CARDS } from './special_cards.js';

export const ALL_CARDS = {
    ...ATTACK_CARDS,
    ...DEFENSE_CARDS,
    ...MAGIC_CARDS,
    ...SUPPORT_CARDS,
    ...SPECIAL_CARDS,
};

export function getCard(id) {
    const card = ALL_CARDS[id];

    if (!card) {
        console.warn(
            `[Cards] Kartu tidak ditemukan: "${id}"`
        );
        return null;
    }

    return {
        ...card
    };
}
export function getAllCardsArray() {
    return Object.values(ALL_CARDS);
}

export const STARTER_DECK = [
    'tebas_biasa', 'tebas_biasa', 'tebas_biasa', 'tebas_biasa',
    'tikam_cepat', 'tikam_cepat',
    'kuda_kuda',   'kuda_kuda',   'kuda_kuda',
    'ofuda_racun',
    'ramuan_darurat',   // tambah 1 heal di starter
    'haste',            // tambah 1 support di starter
    // Total 12 kartu — sedikit lebih banyak dari sebelumnya karena hand size naik
];