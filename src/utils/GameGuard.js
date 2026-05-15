// ============================================================
// GameGuard.js — proteksi refresh/close tab
// Munculkan dialog browser saat player mau meninggalkan halaman
// Auto-checkpoint setelah clear node
// ============================================================

export class GameGuard {

    static _isActive   = false;
    static _handler    = null;

    /**
     * Aktifkan proteksi refresh.
     * Dipanggil saat mulai run (masuk NodeMapScene pertama kali).
     */
    static activate() {
        if (this._isActive) return;
        this._isActive = true;

        this._handler = (e) => {
            e.preventDefault();
            // Teks ini tidak selalu ditampilkan browser (tergantung browser),
            // tapi dialog konfirmasi tetap muncul
            e.returnValue = 'Progress game kamu belum tersimpan. Yakin mau keluar?';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', this._handler);
        console.log('[GameGuard] Aktif — refresh/close akan dikonfirmasi.');
    }

    /**
     * Nonaktifkan proteksi refresh.
     * Dipanggil saat game over, victory, atau simpan & keluar.
     * Tanpa ini, dialog tetap muncul bahkan di halaman lain.
     */
    static deactivate() {
        if (!this._isActive) return;
        this._isActive = false;

        if (this._handler) {
            window.removeEventListener('beforeunload', this._handler);
            this._handler = null;
        }

        console.log('[GameGuard] Nonaktif.');
    }

    static get isActive() {
        return this._isActive;
    }
}