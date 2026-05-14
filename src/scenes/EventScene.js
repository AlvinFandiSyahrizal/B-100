// ============================================================
// EventScene.js — layar random event
// Player pilih satu opsi, ada konsekuensi untung atau buntung
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT, STAT } from '../config/constants.js';

// Pool event — tambah di sini untuk konten lebih banyak
const EVENTS = [
    {
        id:    'altar_misterius',
        title: '⛩  Altar Misterius',
        desc:  'Kamu menemukan altar tua yang masih menyala redup. Ada sesuatu yang bersemayam di sini.',
        options: [
            {
                label:  'Sembahyang di altar',
                result: 'Energi mistis mengalir. HP pulih 20%.',
                effect: (p) => {
                    const heal = Math.floor(p.stats[STAT.HP_MAX] * 0.2);
                    p.hp = Math.min(p.stats[STAT.HP_MAX], p.hp + heal);
                    return `HP +${heal}`;
                },
                type: 'good',
            },
            {
                label:  'Ambil persembahan di altar',
                result: 'Amarah roh! Kamu terluka, tapi mendapat gold.',
                effect: (p) => {
                    const dmg  = Math.floor(p.stats[STAT.HP_MAX] * 0.15);
                    const gold = 40;
                    p.hp   = Math.max(1, p.hp - dmg);
                    p.gold = (p.gold || 0) + gold;
                    return `HP -${dmg}, Gold +${gold}`;
                },
                type: 'mixed',
            },
            {
                label:  'Lewati saja',
                result: 'Kamu memilih tidak mengganggu altar.',
                effect: () => null,
                type:   'neutral',
            },
        ],
    },
    {
        id:    'pedagang_tersasar',
        title: '🧙  Pedagang Tersasar',
        desc:  'Seorang pedagang aneh tersesat di dungeon. Ia menawarkan sesuatu dengan harga murah.',
        options: [
            {
                label:  'Beli obat herbal (30 gold)',
                result: 'Obat herbal yang mujarab. HP pulih 30%.',
                cost:   30,
                effect: (p) => {
                    if ((p.gold || 0) < 30) return 'Gold tidak cukup!';
                    const heal = Math.floor(p.stats[STAT.HP_MAX] * 0.3);
                    p.gold -= 30;
                    p.hp    = Math.min(p.stats[STAT.HP_MAX], p.hp + heal);
                    return `Gold -30, HP +${heal}`;
                },
                type: 'good',
            },
            {
                label:  'Minta petunjuk jalan',
                result: 'Pedagang memberitahu jalur aman. Tidak ada efek tapi kamu merasa lebih siap.',
                effect: () => null,
                type:   'neutral',
            },
            {
                label:  'Abaikan pedagang',
                result: 'Kamu melanjutkan perjalanan.',
                effect: () => null,
                type:   'neutral',
            },
        ],
    },
    {
        id:    'peti_terkutuk',
        title: '📦  Peti Terkutuk',
        desc:  'Sebuah peti besar dengan ukiran aneh. Terasa ada aura gelap dari dalamnya.',
        options: [
            {
                label:  'Buka peti',
                result: '???',
                effect: (p) => {
                    // 50% dapat gold, 50% kena damage
                    if (Math.random() < 0.5) {
                        const gold = 60 + Math.floor(Math.random() * 40);
                        p.gold = (p.gold || 0) + gold;
                        return `Beruntung! Gold +${gold}`;
                    } else {
                        const dmg = Math.floor(p.stats[STAT.HP_MAX] * 0.25);
                        p.hp = Math.max(1, p.hp - dmg);
                        return `Jebakan! HP -${dmg}`;
                    }
                },
                type: 'random',
            },
            {
                label:  'Hancurkan peti tanpa membuka',
                result: 'Lebih aman. Tapi tidak ada yang didapat.',
                effect: () => null,
                type:   'neutral',
            },
        ],
    },
    {
        id:    'yokai_bersahabat',
        title: '🦊  Yokai Bersahabat',
        desc:  'Seekor Kitsune kecil mendekatimu. Ia tampak tidak berbahaya, bahkan sedikit menggemaskan.',
        options: [
            {
                label:  'Beri makanan (jika ada)',
                result: 'Kitsune senang dan memberikan berkahnya.',
                effect: (p) => {
                    const heal = Math.floor(p.stats[STAT.HP_MAX] * 0.1);
                    p.hp = Math.min(p.stats[STAT.HP_MAX], p.hp + heal);
                    return `HP +${heal}`;
                },
                type: 'good',
            },
            {
                label:  'Usir dengan kasar',
                result: 'Kitsune marah dan mengutukmu sebentar.',
                effect: (p) => {
                    const dmg = Math.floor(p.stats[STAT.HP_MAX] * 0.08);
                    p.hp = Math.max(1, p.hp - dmg);
                    return `HP -${dmg}`;
                },
                type: 'bad',
            },
            {
                label:  'Biarkan saja',
                result: 'Kitsune pergi dengan damai.',
                effect: () => null,
                type:   'neutral',
            },
        ],
    },
    {
        id:    'sumber_air_suci',
        title: '💧  Sumber Air Suci',
        desc:  'Sumber air yang bersinar lemah di sudut dungeon. Airnya jernih dan terasa menyejukkan.',
        options: [
            {
                label:  'Minum airnya',
                result: 'Segar! HP dan status effect bersih.',
                effect: (p) => {
                    const heal = Math.floor(p.stats[STAT.HP_MAX] * 0.25);
                    p.hp = Math.min(p.stats[STAT.HP_MAX], p.hp + heal);
                    p.statusEffects = [];
                    return `HP +${heal}, status bersih`;
                },
                type: 'good',
            },
            {
                label:  'Isi untuk perjalanan (tidak ada efek sekarang)',
                result: 'Kamu menyimpan air suci untuk nanti.',
                effect: () => null,
                type:   'neutral',
            },
        ],
    },
];

export class EventScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.EVENT });
    }

    init(data) {
        this.zone          = data.zone          || 1;
        this.floor         = data.floor         || 1;
        this.curseLevel    = data.curseLevel    || 1;
        this.playerData    = data.playerData    || null;
        this.mapData       = data.mapData       || null;
        this.currentNodeId = data.currentNodeId || 'start';

        // Pilih event random
        this.event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        this.resolved = false;
    }

    create() {
        this._buildBackground();
        this._buildEventCard();
        this._buildOptions();
    }

    // ── UI ────────────────────────────────────────────────────

    _buildBackground() {
        this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x07080d
        );

        // Panel
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 780, 480, 0x0d0e18)
            .setStrokeStyle(1, 0x1e2030);
    }

    _buildEventCard() {
        const ev = this.event;

        // Label
        this.add.text(GAME_WIDTH / 2, 95, '❓  RANDOM EVENT', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#334455', letterSpacing: 3,
        }).setOrigin(0.5);

        // Judul event
        this.add.text(GAME_WIDTH / 2, 140, ev.title, {
            fontFamily: 'monospace', fontSize: '26px',
            color: '#ccaa55', fontStyle: 'bold',
        }).setOrigin(0.5);

        // Garis
        const g = this.add.graphics();
        g.lineStyle(1, 0x222233, 1);
        g.moveTo(GAME_WIDTH / 2 - 280, 165);
        g.lineTo(GAME_WIDTH / 2 + 280, 165);
        g.strokePath();

        // Deskripsi
        this.add.text(GAME_WIDTH / 2, 210, ev.desc, {
            fontFamily: 'monospace', fontSize: '14px',
            color: '#556677', align: 'center',
            wordWrap: { width: 620 }, lineSpacing: 6,
        }).setOrigin(0.5);

        // Result area (awalnya kosong)
        this.resultText = this.add.text(GAME_WIDTH / 2, 275, '', {
            fontFamily: 'monospace', fontSize: '16px',
            color: '#88bb88', fontStyle: 'bold', align: 'center',
        }).setOrigin(0.5);
    }

    _buildOptions() {
        const ev      = this.event;
        const startY  = 330;
        const spacing = 65;

        this.optionBtns = [];

        ev.options.forEach((opt, i) => {
            const y = startY + i * spacing;
            this._createOptionButton(opt, GAME_WIDTH / 2, y, i);
        });
    }

    _createOptionButton(opt, x, y, index) {
        const w = 620, h = 50;

        const typeColors = {
            good:    0x224422,
            bad:     0x441122,
            mixed:   0x332211,
            random:  0x221133,
            neutral: 0x111122,
        };
        const borderColors = {
            good:    0x336633,
            bad:     0x663333,
            mixed:   0x664422,
            random:  0x443366,
            neutral: 0x222244,
        };

        const bg = this.add.rectangle(x, y, w, h, typeColors[opt.type] || 0x111122)
            .setStrokeStyle(1, borderColors[opt.type] || 0x222244)
            .setInteractive({ useHandCursor: true });

        const txt = this.add.text(x, y, opt.label, {
            fontFamily: 'monospace', fontSize: '14px', color: '#8899aa',
        }).setOrigin(0.5);

        // Cost label kalau ada
        if (opt.cost) {
            this.add.text(x + w / 2 - 60, y, `💰 ${opt.cost}`, {
                fontFamily: 'monospace', fontSize: '12px', color: '#886633',
            }).setOrigin(0.5);
        }

        bg.on('pointerover', () => {
            if (!this.resolved) {
                bg.setFillStyle((typeColors[opt.type] || 0x111122) + 0x0a0a0a);
                txt.setColor('#ffffff');
            }
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(typeColors[opt.type] || 0x111122);
            txt.setColor('#8899aa');
        });

        bg.on('pointerdown', () => {
            if (this.resolved) return;
            this._resolveOption(opt, bg, txt);
        });

        this.optionBtns.push({ bg, txt });
    }

    // ── Resolution ────────────────────────────────────────────

    _resolveOption(opt, selectedBg, selectedTxt) {
        this.resolved = true;

        // Jalankan efek ke playerData
        let resultMsg = opt.result;
        if (this.playerData && opt.effect) {
            // Buat proxy player sederhana dari playerData
            const proxy = {
                hp:            this.playerData.hp,
                gold:          this.playerData.gold || 0,
                statusEffects: this.playerData.statusEffects || [],
                stats:         this.playerData.stats || { hp_max: 100 },
            };

            const extraMsg = opt.effect(proxy);

            // Apply kembali ke playerData
            this.playerData.hp            = proxy.hp;
            this.playerData.gold          = proxy.gold;
            this.playerData.statusEffects = proxy.statusEffects;

            if (extraMsg) resultMsg = extraMsg;
        }

        // Tampilkan hasil
        this.resultText.setText(resultMsg);

        // Highlight pilihan yang dipilih
        selectedBg.setStrokeStyle(2, 0xffcc44);
        selectedTxt.setColor('#ffcc44');

        // Greyed out pilihan lain
        this.optionBtns.forEach(({ bg, txt }) => {
            if (bg !== selectedBg) {
                bg.setFillStyle(0x0a0a0a).disableInteractive();
                txt.setColor('#222233');
            }
        });

        // Tombol lanjut
        this.time.delayedCall(600, () => {
            this._buildContinueButton();
        });
    }

    _buildContinueButton() {
        const bx = GAME_WIDTH / 2;
        const by = GAME_HEIGHT - 65;

        const bg = this.add.rectangle(bx, by, 220, 40, 0x0d0d1a)
            .setStrokeStyle(1, 0x334455)
            .setInteractive({ useHandCursor: true });

        const txt = this.add.text(bx, by, '→  Lanjutkan Perjalanan', {
            fontFamily: 'monospace', fontSize: '13px', color: '#445566',
        }).setOrigin(0.5);

        bg.on('pointerover', () => { bg.setFillStyle(0x111133); txt.setColor('#6688aa'); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x0d0d1a); txt.setColor('#445566'); });
        bg.on('pointerdown', () => {
            this.scene.start(SCENE.NODE_MAP, {
                zone:          this.zone,
                floor:         this.floor,
                curseLevel:    this.curseLevel,
                playerData:    this.playerData,
                mapData:       this.mapData,
                currentNodeId: this.currentNodeId,
            });
        });
    }
}