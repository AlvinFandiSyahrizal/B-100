// ============================================================
// BootScene.js — scene pertama yang jalan
// Tugasnya: load asset minimal (loading bar), lalu lanjut ke PreloadScene
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.BOOT });
    }

    preload() {
        // Di sini load asset yang dibutuhkan untuk loading screen
        // Sementara pakai placeholder warna dulu, nanti ganti sprite asli

        // Buat loading bar pakai graphics (tidak butuh asset eksternal)
        this._createLoadingBar();
    }

    create() {
        // Langsung ke PreloadScene
        this.scene.start(SCENE.PRELOAD);
    }

    // ── Private ───────────────────────────────────────────────

    _createLoadingBar() {
        const cx = GAME_WIDTH  / 2;
        const cy = GAME_HEIGHT / 2;

        // Background bar
        const barBg = this.add.graphics();
        barBg.fillStyle(0x222233, 1);
        barBg.fillRect(cx - 200, cy - 15, 400, 30);

        // Bar isi
        const bar = this.add.graphics();

        // Teks loading
        this.add.text(cx, cy - 40, 'Memuat...', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#aaaacc',
        }).setOrigin(0.5);

        // Update bar sesuai progress
        this.load.on('progress', (value) => {
            bar.clear();
            bar.fillStyle(0x6644aa, 1);
            bar.fillRect(cx - 198, cy - 13, 396 * value, 26);
        });
    }
}
