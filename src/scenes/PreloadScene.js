// ============================================================
// PreloadScene.js — load semua asset sebelum game jalan
// Phase 1: pakai placeholder warna, belum ada sprite asli
// Nanti tinggal ganti path di sini kalau asset sudah ada
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.PRELOAD });
    }

    preload() {
        this._showLoadingUI();

        // ── Placeholder Textures ──────────────────────────────
        // Phase 1: generate texture warna pakai graphics
        // Nanti kalau asset pixel art sudah ada, ganti pakai:
        // this.load.image('player', 'assets/sprites/player/player_body.png');
        // this.load.spritesheet('player_idle', 'assets/sprites/player/idle.png', { frameWidth: 48, frameHeight: 48 });

        // Untuk sekarang semua dibuat via generateTexture di create()
    }

    create() {
        // Generate placeholder textures pakai graphics
        // Ini yang dipakai semua scene sampai asset asli ada

        this._generatePlaceholderTextures();

        // Lanjut ke MainMenu
        this.scene.start(SCENE.MAIN_MENU);
    }

    // ── Private ───────────────────────────────────────────────

    _showLoadingUI() {
        const cx = GAME_WIDTH  / 2;
        const cy = GAME_HEIGHT / 2;

        // Background gelap
        this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x0a0a0f);

        // Judul
        this.add.text(cx, cy - 80, 'DUNGEON B100', {
            fontFamily: 'monospace',
            fontSize: '36px',
            color: '#cc8833',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(cx, cy - 45, 'Roguelite Turn-Based RPG', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#7766aa',
        }).setOrigin(0.5);

        // Loading bar
        const barBg = this.add.graphics();
        barBg.fillStyle(0x222233, 1);
        barBg.fillRect(cx - 200, cy - 10, 400, 20);

        const bar = this.add.graphics();

        const loadText = this.add.text(cx, cy + 25, 'Memasuki Dungeon...', {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#555577',
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            bar.clear();
            bar.fillStyle(0xcc8833, 1);
            bar.fillRect(cx - 198, cy - 8, 396 * value, 16);
        });

        this.load.on('complete', () => {
            loadText.setText('Siap!');
        });
    }

    _generatePlaceholderTextures() {
        // ── Player placeholder ────────────────────────────────
        // Kotak biru 48x48 untuk MC
        if (!this.textures.exists('player')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x4488cc, 1);
            g.fillRect(0, 0, 48, 48);
            g.fillStyle(0x66aaff, 1);
            g.fillRect(10, 5, 28, 20);  // kepala
            g.fillStyle(0x2255aa, 1);
            g.fillRect(8, 28, 12, 18);  // kaki kiri
            g.fillRect(28, 28, 12, 18); // kaki kanan
            g.generateTexture('player', 48, 48);
            g.destroy();
        }

        // ── Monster placeholder ───────────────────────────────
        if (!this.textures.exists('monster_basic')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xcc4433, 1);
            g.fillRect(0, 0, 48, 48);
            g.fillStyle(0xff6655, 1);
            g.fillRect(8, 5, 32, 20);   // kepala
            g.fillStyle(0xaa2211, 1);
            g.fillRect(10, 28, 12, 18); // kaki
            g.fillRect(26, 28, 12, 18);
            g.generateTexture('monster_basic', 48, 48);
            g.destroy();
        }

        // ── Card placeholders ─────────────────────────────────
        const cardColors = {
            card_attack:  0xcc4444,
            card_defense: 0x4444cc,
            card_magic:   0xaa44cc,
            card_support: 0x44aa44,
        };

        for (const [key, color] of Object.entries(cardColors)) {
            if (!this.textures.exists(key)) {
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                g.fillStyle(0x111122, 1);
                g.fillRoundedRect(0, 0, 80, 110, 6);
                g.fillStyle(color, 1);
                g.fillRoundedRect(4, 4, 72, 70, 4);
                g.generateTexture(key, 80, 110);
                g.destroy();
            }
        }

        // ── UI placeholders ───────────────────────────────────
        if (!this.textures.exists('panel')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x111122, 0.9);
            g.fillRoundedRect(0, 0, 200, 100, 8);
            g.lineStyle(1, 0x333355, 1);
            g.strokeRoundedRect(0, 0, 200, 100, 8);
            g.generateTexture('panel', 200, 100);
            g.destroy();
        }

        // Pixel putih 1x1 — berguna untuk tinting dan rectangle dinamis
        if (!this.textures.exists('pixel')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 1);
            g.fillRect(0, 0, 1, 1);
            g.generateTexture('pixel', 1, 1);
            g.destroy();
        }
    }
}

