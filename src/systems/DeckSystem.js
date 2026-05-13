// ============================================================
// DeckSystem.js — semua logika yang berkaitan dengan deck
// CombatSystem dan Player menggunakan ini
// ============================================================

import { getCard } from '../data/cards/index.js';
import { MAX_DECK_SIZE } from '../config/constants.js';

export class DeckSystem {
    /**
     * Buat deck dari array card ID.
     * @param {string[]} cardIds
     * @returns {object[]} array kartu siap pakai
     */
    static buildDeckFromIds(cardIds) {
        return cardIds
            .map(id => {
                const card = getCard(id);
                if (!card) return null;
                // Return salinan biar tidak mutate data global
                return { ...card };
            })
            .filter(Boolean);
    }

    /**
     * Shuffle array in-place (Fisher-Yates).
     */
    static shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Tarik `count` kartu dari deck ke tangan.
     * Kalau deck habis, reshuffle discard dulu.
     *
     * @param {object}   player
     * @param {number}   count
     */
    static draw(player, count) {
        for (let i = 0; i < count; i++) {
            if (player.deck.length === 0) {
                this.reshuffleDiscard(player);
            }
            if (player.deck.length === 0) break;

            const card = player.deck.pop();
            player.hand.push(card);
        }
    }

    /**
     * Pindahkan discard ke deck dan shuffle.
     */
    static reshuffleDiscard(player) {
        player.deck    = [...player.discard];
        player.discard = [];
        this.shuffle(player.deck);
    }

    /**
     * Pindahkan semua kartu di tangan ke discard.
     */
    static discardHand(player) {
        player.discard.push(...player.hand);
        player.hand = [];
    }

    /**
     * Tambahkan kartu ke deck player (setelah reward, shop, dll).
     * Return false kalau deck sudah max.
     *
     * @param {object} player
     * @param {string} cardId
     */
    static addCard(player, cardId) {
        const totalSize = player.deck.length + player.hand.length + player.discard.length;
        if (totalSize >= MAX_DECK_SIZE) {
            console.warn('[DeckSystem] Deck sudah penuh, tidak bisa tambah kartu.');
            return false;
        }

        const card = getCard(cardId);
        if (!card) return false;

        // Kartu baru masuk ke discard (bukan deck atas), biar tidak langsung ditarik
        player.discard.push({ ...card });
        return true;
    }

    /**
     * Hapus kartu dari deck (purge di merchant).
     * Cari dari deck, lalu discard kalau tidak ada di deck.
     *
     * @param {object} player
     * @param {string} cardId
     * @returns {boolean} berhasil dihapus atau tidak
     */
    static removeCard(player, cardId) {
        // Cari di deck
        let idx = player.deck.findIndex(c => c.id === cardId);
        if (idx !== -1) {
            player.deck.splice(idx, 1);
            return true;
        }

        // Cari di discard
        idx = player.discard.findIndex(c => c.id === cardId);
        if (idx !== -1) {
            player.discard.splice(idx, 1);
            return true;
        }

        console.warn(`[DeckSystem] Kartu "${cardId}" tidak ditemukan untuk dihapus.`);
        return false;
    }

    /**
     * Upgrade kartu di deck.
     * Cari kartu dengan ID asli, ganti dengan versi upgrade.
     *
     * @param {object} player
     * @param {string} cardId - ID kartu yang mau di-upgrade
     * @returns {boolean}
     */
    static upgradeCard(player, cardId) {
        const original = getCard(cardId);
        if (!original || !original.upgradedId) {
            console.warn(`[DeckSystem] Kartu "${cardId}" tidak punya versi upgrade.`);
            return false;
        }

        const upgraded = getCard(original.upgradedId);
        if (!upgraded) return false;

        // Cari di deck
        let idx = player.deck.findIndex(c => c.id === cardId);
        if (idx !== -1) {
            player.deck[idx] = { ...upgraded };
            return true;
        }

        // Cari di discard
        idx = player.discard.findIndex(c => c.id === cardId);
        if (idx !== -1) {
            player.discard[idx] = { ...upgraded };
            return true;
        }

        return false;
    }

    /**
     * Ambil semua kartu player sebagai satu flat array (untuk ditampilkan di DeckViewer).
     */
    static getAllCards(player) {
        return [...player.deck, ...player.hand, ...player.discard];
    }

    /**
     * Hitung total kartu player.
     */
    static totalCards(player) {
        return player.deck.length + player.hand.length + player.discard.length;
    }
}
