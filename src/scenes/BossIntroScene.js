// ============================================================
// BossIntroScene.js — cutscene singkat sebelum masuk boss fight
// Tampilkan nama boss, lore singkat, lalu masuk CombatScene
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

// Data intro tiap boss per zona
const BOSS_INTROS = {
    1: {
        name:    'Kappa Agung',
        title:   'Penguasa Sungai B10',
        lore:    'Kappa tertua yang pernah ada. Cangkangnya keras seperti baja,\ndan air di piring kepalanya tak pernah tumpah meski di tengah badai.',
        color:   '#44aacc',
    },
    2: {
        name:    'Tengu Merah',
        title:   'Penjaga Hutan B20',
        lore:    'Tengu dengan sayap merah darah. Katanya ia pernah mengalahkan\nseribu samurai sendirian di puncak gunung.',
        color:   '#cc4444',
    },
    3: {
        name:    'Umi-bozu Raksasa',
        title:   'Teror Lautan B30',
        lore:    'Makhluk hitam sebesar gunung yang muncul dari kedalaman laut.\nKapal yang melihatnya tidak pernah kembali.',
        color:   '#4444aa',
    },
    4: {
        name:    'Kasha Api',
        title:   'Pemakan Jiwa B40',
        lore:    'Kereta api yang menarik jiwa orang jahat ke neraka.\nKali ini ia datang untukmu.',
        color:   '#cc6622',
    },
    5: {
        name:    'Gashadokuro',
        title:   'Tengkorak Abadi B50',
        lore:    'Dibentuk dari tulang prajurit yang mati kelaparan di medan perang.\nLaparnya tidak pernah terpuaskan.',
        color:   '#88aa44',
    },
    6: {
        name:    'Oni Perang',
        title:   'Jenderal Kegelapan B60',
        lore:    'Oni yang memimpin pasukan iblis. Tongkat besinya bisa menghancurkan\ngunung dengan satu ayunan.',
        color:   '#aa2222',
    },
    7: {
        name:    'Tanuki Raja',
        title:   'Master Ilusi B70',
        lore:    'Tanuki tertua yang bisa mengubah dirinya menjadi apapun.\nJangan percaya apa yang kamu lihat.',
        color:   '#aa8833',
    },
    8: {
        name:    'Raijin Palsu',
        title:   'Dewa Petir Tersesat B80',
        lore:    'Raijin yang kehilangan kesadarannya. Petirnya menyambar\ntanpa kendali, menghancurkan apapun di sekitarnya.',
        color:   '#4488cc',
    },
    9: {
        name:    'Orochi',
        title:   'Ular Berkepala Delapan B90',
        lore:    'Ular raksasa kuno dengan delapan kepala. Setiap kepalanya\nmemiliki kekuatan dan racun yang berbeda.',
        color:   '#448844',
    },
    10: {
        name:    'Susanoo Palsu',
        title:   'Final Boss — B100',
        lore:    'Bukan dewa yang sesungguhnya. Tapi kekuatannya nyata.\nIni adalah akhir dari segalanya.',
        color:   '#cc8833',
    },
};

export class BossIntroScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.BOSS_INTRO });
    }

    init(data) {
        this.zone          = data.zone          || 1;
        this.floor         = data.floor         || 1;
        this.curseLevel    = data.curseLevel    || 1;
        this.playerData    = data.playerData    || null;
        this.mapData       = data.mapData       || null;
        this.currentNodeId = data.currentNodeId || 'boss';
    }

    create() {
        const intro = BOSS_INTROS[this.zone] || BOSS_INTROS[1];

        this._buildBackground(intro.color);
        this._buildBossInfo(intro);
        this._buildContinuePrompt();

        // Auto lanjut setelah 4 detik, atau klik untuk skip
        this.time.delayedCall(4000, () => this._startBossFight());
        this.input.once('pointerdown', () => this._startBossFight());
        this.input.keyboard.once('keydown', () => this._startBossFight());
    }

    // ── UI ────────────────────────────────────────────────────

    _buildBackground(color) {
        this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x050508
        );

        // Garis vertikal dekoratif
        const g = this.add.graphics();
        g.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.1);
        for (let x = 0; x < GAME_WIDTH; x += 60) {
            g.moveTo(x, 0); g.lineTo(x, GAME_HEIGHT);
        }
        g.strokePath();
    }

    _buildBossInfo(intro) {
        const cx = GAME_WIDTH / 2;

        // Label zona
        this.add.text(cx, 140, `— ZONA ${this.zone} BOSS —`, {
            fontFamily:    'monospace',
            fontSize:      '13px',
            color:         '#334455',
            letterSpacing: 4,
        }).setOrigin(0.5);

        // Nama boss
        this.add.text(cx, 210, intro.name, {
            fontFamily: 'monospace',
            fontSize:   '52px',
            fontStyle:  'bold',
            color:      intro.color,
            stroke:     '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        // Title
        this.add.text(cx, 270, intro.title, {
            fontFamily:    'monospace',
            fontSize:      '16px',
            color:         '#556677',
            letterSpacing: 2,
        }).setOrigin(0.5);

        // Garis dekoratif
        const g = this.add.graphics();
        g.lineStyle(1, 0x222233, 1);
        g.moveTo(cx - 250, 300); g.lineTo(cx + 250, 300);
        g.strokePath();

        // Lore text
        this.add.text(cx, 360, intro.lore, {
            fontFamily: 'monospace',
            fontSize:   '14px',
            color:      '#445566',
            fontStyle:  'italic',
            align:      'center',
            lineSpacing: 8,
        }).setOrigin(0.5);

        // Lantai
        this.add.text(cx, GAME_HEIGHT - 100, `B${this.floor}`, {
            fontFamily: 'monospace',
            fontSize:   '80px',
            fontStyle:  'bold',
            color:      '#111122',
        }).setOrigin(0.5);
    }

    _buildContinuePrompt() {
        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 55, 'Klik atau tekan tombol apapun untuk lanjut...', {
            fontFamily: 'monospace',
            fontSize:   '12px',
            color:      '#222233',
        }).setOrigin(0.5);

        // Kedip-kedip
        this.tweens.add({
            targets:  txt,
            alpha:    0,
            duration: 800,
            yoyo:     true,
            repeat:   -1,
        });
    }

    // ── Navigation ────────────────────────────────────────────

    _startBossFight() {
        // Hindari double trigger
        if (this._started) return;
        this._started = true;

        this.scene.start(SCENE.COMBAT, {
            zone:          this.zone,
            floor:         this.floor,
            curseLevel:    this.curseLevel,
            playerData:    this.playerData,
            mapData:       this.mapData,
            currentNodeId: this.currentNodeId,
            isBoss:        true,
        });
    }
}