// ============================================================
// CharacterSelectScene.js — layar pilih karakter sebelum run
// Pilih nama MC, curse level, lihat info difficulty
// Phase 3+: nanti tambah pilih companion & pet starter di sini
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT, MAX_CURSE_LEVEL, MIN_CURSE_LEVEL,
         CURSE_STAT_MULTIPLIER, CURSE_REWARD_MULTIPLIER } from '../config/constants.js';
import { SaveSystem } from '../storage/SaveSystem.js';
import { GameGuard }  from '../utils/GameGuard.js';

// Info tiap curse level
const CURSE_INFO = [
    null, // index 0 kosong
    {
        name:   'Bisikan Dungeon',
        desc:   'Dungeon baru terjaga. Musuh belum sepenuhnya sadar.',
        flavor: '"Langkah pertama selalu yang paling aman."',
        color:  '#44aa44',
    },
    {
        name:   'Gema Kutukan',
        desc:   'Dungeon mulai bereaksi terhadap kehadiranmu.',
        flavor: '"Kamu mulai terasa asing di tempat ini."',
        color:  '#88aa44',
    },
    {
        name:   'Amarah Yokai',
        desc:   'Para yokai semakin kuat dan waspada. Reward lebih besar.',
        flavor: '"Mereka tahu kamu akan datang."',
        color:  '#ccaa44',
    },
    {
        name:   'Murka Abadi',
        desc:   'Dungeon bergolak. Hanya yang kuat yang bisa bertahan.',
        flavor: '"Setiap langkah adalah pertaruhan nyawa."',
        color:  '#cc6633',
    },
    {
        name:   'Kehancuran Total',
        desc:   'Kutukan penuh. Musuh sangat kuat, reward sangat besar.',
        flavor: '"Tidak ada yang kembali dari sini... sampai sekarang."',
        color:  '#cc3333',
    },
];

export class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.CHAR_SEL });
    }

    init() {
        this.curseLevel  = 1;
        this.playerName  = 'Samurai';
        this.nameEditing = false;
    }

    create() {
        this._buildBackground();
        this._buildTitle();
        this._buildNameInput();
        this._buildCurseInfo();           
        this._buildCurseLevelSelector();  
        this._buildStartButton();
        this._buildBackButton();
    }

    // ── UI ────────────────────────────────────────────────────

    _buildBackground() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x07080d);

        // Efek grid
        const g = this.add.graphics();
        g.lineStyle(1, 0x111122, 0.4);
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            g.moveTo(0, y); g.lineTo(GAME_WIDTH, y);
        }
        g.strokePath();
    }

    _buildTitle() {
        this.add.text(GAME_WIDTH / 2, 70, 'DUNGEON  B100', {
            fontFamily: 'monospace', fontSize: '13px',
            color: '#443322', letterSpacing: 6,
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 105, 'Persiapkan Diri', {
            fontFamily: 'monospace', fontSize: '32px',
            color: '#cc8833', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 143,
            'Setiap keputusan di layar ini akan mempengaruhi seluruh perjalananmu.', {
            fontFamily: 'monospace', fontSize: '12px',
            color: '#334455', fontStyle: 'italic',
        }).setOrigin(0.5);
    }

    _buildNameInput() {
        this.add.text(GAME_WIDTH / 2 - 200, 200, 'NAMA SAMURAI', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#334455', letterSpacing: 2,
        });

        // Input field
        const fieldBg = this.add.rectangle(GAME_WIDTH / 2 - 50, 225, 300, 40, 0x111122)
            .setStrokeStyle(1, 0x334455)
            .setInteractive({ useHandCursor: true });

        this.nameTxt = this.add.text(GAME_WIDTH / 2 - 50, 225, this.playerName, {
            fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
        }).setOrigin(0.5);

        // Cursor kedip
        this.cursor = this.add.text(GAME_WIDTH / 2 - 50 + 80, 225, '', {
            fontFamily: 'monospace', fontSize: '18px', color: '#cc8833',
        }).setOrigin(0.5);

        // Klik untuk edit
        fieldBg.on('pointerdown', () => {
            this.nameEditing = true;
            fieldBg.setStrokeStyle(2, 0xcc8833);
            this._startCursorBlink();
        });

        // Keyboard input
        this.input.keyboard.on('keydown', (event) => {
            if (!this.nameEditing) return;

            if (event.key === 'Enter' || event.key === 'Escape') {
                this.nameEditing = false;
                fieldBg.setStrokeStyle(1, 0x334455);
                this.cursor.setText('');
                return;
            }

            if (event.key === 'Backspace') {
                this.playerName = this.playerName.slice(0, -1);
            } else if (event.key.length === 1 && this.playerName.length < 16) {
                this.playerName += event.key;
            }

            this.nameTxt.setText(this.playerName || ' ');
            // Update posisi cursor
            const nameWidth = this.nameTxt.width;
            this.cursor.setX(GAME_WIDTH / 2 - 50 - 150 + nameWidth + 5);
        });
    }

    _startCursorBlink() {
        if (this._cursorTween) this._cursorTween.stop();
        this._cursorTween = this.tweens.add({
            targets:  this.cursor,
            alpha:    0,
            duration: 500,
            yoyo:     true,
            repeat:   -1,
            onUpdate: () => {
                if (!this.nameEditing) {
                    this._cursorTween.stop();
                    this.cursor.setText('');
                } else {
                    this.cursor.setText('|');
                }
            },
        });
    }

    _buildCurseLevelSelector() {
        this.add.text(GAME_WIDTH / 2 - 200, 285, 'CURSE LEVEL', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#334455', letterSpacing: 2,
        });

        // Tombol - dan +
        const btnLeft = this.add.rectangle(GAME_WIDTH / 2 - 180, 315, 40, 36, 0x111122)
            .setStrokeStyle(1, 0x223344)
            .setInteractive({ useHandCursor: true });
        this.add.text(GAME_WIDTH / 2 - 180, 315, '◀', {
            fontFamily: 'monospace', fontSize: '16px', color: '#4466aa',
        }).setOrigin(0.5);

        const btnRight = this.add.rectangle(GAME_WIDTH / 2 + 80, 315, 40, 36, 0x111122)
            .setStrokeStyle(1, 0x223344)
            .setInteractive({ useHandCursor: true });
        this.add.text(GAME_WIDTH / 2 + 80, 315, '▶', {
            fontFamily: 'monospace', fontSize: '16px', color: '#4466aa',
        }).setOrigin(0.5);

        // Display level
        this.curseLevelTxt = this.add.text(GAME_WIDTH / 2 - 50, 315, '', {
            fontFamily: 'monospace', fontSize: '22px',
            color: '#cc8833', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.curseNameTxt = this.add.text(GAME_WIDTH / 2 - 50, 340, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#556677',
        }).setOrigin(0.5);

        btnLeft.on('pointerdown', () => {
            if (this.curseLevel > MIN_CURSE_LEVEL) {
                this.curseLevel--;
                this._updateCurseDisplay();
            }
        });

        btnRight.on('pointerdown', () => {
            if (this.curseLevel < MAX_CURSE_LEVEL) {
                this.curseLevel++;
                this._updateCurseDisplay();
            }
        });

        this._updateCurseDisplay();
    }

    _buildCurseInfo() {
        // Panel info curse level
        this.cursePanelBg = this.add.rectangle(GAME_WIDTH / 2, 460, 600, 140, 0x0d0e1a)
            .setStrokeStyle(1, 0x1a1a2e);

        this.curseDescTxt = this.add.text(GAME_WIDTH / 2, 435, '', {
            fontFamily: 'monospace', fontSize: '13px', color: '#667788',
            align: 'center', wordWrap: { width: 560 },
        }).setOrigin(0.5);

        this.curseFlavorTxt = this.add.text(GAME_WIDTH / 2, 465, '', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#334455', fontStyle: 'italic',
        }).setOrigin(0.5);

        // Stat multiplier info
        this.curseStatTxt = this.add.text(GAME_WIDTH / 2, 495, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#445566',
            align: 'center',
        }).setOrigin(0.5);

        this._updateCurseInfo();
    }

    _buildStartButton() {
        const bx = GAME_WIDTH / 2;
        const by = GAME_HEIGHT - 110;

        const bg = this.add.rectangle(bx, by, 280, 52, 0x1a0a0a)
            .setStrokeStyle(1, 0x663322)
            .setInteractive({ useHandCursor: true });

        const txt = this.add.text(bx, by, '⚔  Masuki Dungeon', {
            fontFamily: 'monospace', fontSize: '18px', color: '#cc6633',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        bg.on('pointerover', () => { bg.setFillStyle(0x2a1010); txt.setColor('#ff8844'); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x1a0a0a); txt.setColor('#cc6633'); });
        bg.on('pointerdown', () => this._startRun());
    }

    _buildBackButton() {
        const bg = this.add.rectangle(80, GAME_HEIGHT - 50, 120, 34, 0x0d0d1a)
            .setStrokeStyle(1, 0x222233)
            .setInteractive({ useHandCursor: true });

        const txt = this.add.text(80, GAME_HEIGHT - 50, '← Kembali', {
            fontFamily: 'monospace', fontSize: '12px', color: '#334455',
        }).setOrigin(0.5);

        bg.on('pointerover', () => txt.setColor('#6677aa'));
        bg.on('pointerout',  () => txt.setColor('#334455'));
        bg.on('pointerdown', () => this.scene.start(SCENE.MAIN_MENU));
    }

    // ── Update Display ────────────────────────────────────────

    _updateCurseDisplay() {
        const info = CURSE_INFO[this.curseLevel];
        this.curseLevelTxt.setText(`${this.curseLevel}  /  ${MAX_CURSE_LEVEL}`);
        this.curseLevelTxt.setColor(info?.color || '#cc8833');
        this.curseNameTxt.setText(info?.name || '').setColor(info?.color || '#cc8833');
        this._updateCurseInfo();
    }

    _updateCurseInfo() {
        const info  = CURSE_INFO[this.curseLevel];
        if (!info) return;

        this.curseDescTxt.setText(info.desc);
        this.curseFlavorTxt.setText(info.flavor);

        const statMult   = CURSE_STAT_MULTIPLIER[this.curseLevel] || 1;
        const rewardMult = CURSE_REWARD_MULTIPLIER[this.curseLevel] || 1;
        this.curseStatTxt.setText(
            `Musuh: ×${statMult.toFixed(1)} stat   |   Reward: ×${rewardMult.toFixed(1)} gold & item`
        );
    }

    // ── Start Run ─────────────────────────────────────────────

    _startRun() {
        const name = this.playerName.trim() || 'Samurai';

        // Hapus save lama kalau ada
        SaveSystem.clearRun();
        GameGuard.activate();

        this.scene.start(SCENE.NODE_MAP, {
            zone:       1,
            floor:      1,
            curseLevel: this.curseLevel,
            playerName: name,
            mapData:    null,
        });
    }
}