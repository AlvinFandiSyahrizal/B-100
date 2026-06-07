// ============================================================
// GashaponScene.js — layar gacha Gashapon yokai
// 2 mesin: Companion (Mesin Oni) dan Pet (Mesin Ryuu)
// Animasi: putar mesin → kapsul keluar → reveal hasil
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT, RARITY_COLOR } from '../config/constants.js';
import { MagatamaSystem, MAGATAMA_COST } from '../systems/MagatamaSystem.js';
import { SaveSystem }     from '../storage/SaveSystem.js';
import { getAllCompanions, getCompanion } from '../data/companions/index.js';
import { getAllPets, getPet }             from '../data/pets/index.js';

// ── Rarity config ─────────────────────────────────────────────
const RARITY_WEIGHTS = {
    common:    50,
    rare:      30,
    ancient:   15,
    mythic:     4,
    divine:     1,
};

const RARITY_LABEL = {
    common:   '○ Common',
    rare:     '★ Rare',
    ancient:  '✦ Ancient',
    mythic:   '✸ Mythic',
    divine:   '❋ Divine',
};

const RARITY_GLOW = {
    common:   0x557755,
    rare:     0x336699,
    ancient:  0x774499,
    mythic:   0xaa7722,
    divine:   0xffcc33,
};

// Mesin yang tersedia
const MACHINES = [
    {
        id:          'companion',
        name:        'Mesin Oni',
        subtitle:    'Panggil Companion Yokai',
        icon:        '👹',
        color:       0xcc3322,
        borderColor: 0xff4433,
        x:           GAME_WIDTH / 2 - 220,
    },
    {
        id:          'pet',
        name:        'Mesin Ryuu',
        subtitle:    'Panggil Pet Yokai',
        icon:        '🐉',
        color:       0x2244cc,
        borderColor: 0x3366ff,
        x:           GAME_WIDTH / 2 + 220,
    },
];

export class GashaponScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.GASHAPON });
    }

    init() {
        this.meta            = SaveSystem.loadMeta();
        this.magatama        = MagatamaSystem.getBalance();
        this._animating      = false;
        this._selectedMachine = null;
    }

    create() {
        this._buildBackground();
        this._buildHeader();
        this._buildMachines();
        this._buildPullButtons();
        this._buildResultArea();
        this._buildBackButton();
        this._buildOwnedPreview();
    }

    // ── Background ────────────────────────────────────────────
    _buildBackground() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x06060e);

        const g = this.add.graphics();
        g.lineStyle(1, 0x111122, 0.4);
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            g.moveTo(0, y); g.lineTo(GAME_WIDTH, y);
        }
        g.strokePath();

        // Partikel bintang
        for (let i = 0; i < 30; i++) {
            const x   = Math.random() * GAME_WIDTH;
            const y   = Math.random() * GAME_HEIGHT;
            const dot = this.add.circle(x, y, Math.random() * 1.5 + 0.5, 0xffffff, 0.15);
            this.tweens.add({
                targets:  dot,
                alpha:    { from: 0.05, to: 0.3 },
                duration: Phaser.Math.Between(1500, 3500),
                yoyo: true, repeat: -1,
                delay: Phaser.Math.Between(0, 2000),
            });
        }
    }

    // ── Header ────────────────────────────────────────────────
    _buildHeader() {
        this.add.text(GAME_WIDTH / 2, 38, '🎰  GASHAPON YOKAI  🎰', {
            fontFamily: 'monospace', fontSize: '22px',
            color: '#cc8833', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 66, 'Panggil yokai legendaris dari dunia lain', {
            fontFamily: 'monospace', fontSize: '11px', color: '#445566',
        }).setOrigin(0.5);

        // Magatama display
        this.magatamaTxt = this.add.text(GAME_WIDTH / 2, 90, `🪬 ${this.magatama} Magatama`, {
            fontFamily: 'monospace', fontSize: '14px',
            color: '#aa66cc', fontStyle: 'bold',
        }).setOrigin(0.5);

        // Garis
        const g = this.add.graphics();
        g.lineStyle(1, 0x1a1a2e);
        g.moveTo(60, 106); g.lineTo(GAME_WIDTH - 60, 106);
        g.strokePath();
    }

    // ── Machines ──────────────────────────────────────────────
    _buildMachines() {
        MACHINES.forEach(machine => {
            this._buildOneMachine(machine);
        });
    }

    _buildOneMachine(machine) {
        const x = machine.x;
        const y = 300;
        const w = 300, h = 280;

        // Panel mesin
        const panel = this.add.rectangle(x, y, w, h, 0x0d0d1a)
            .setStrokeStyle(2, machine.borderColor);

        // Glow mesin
        const glow = this.add.rectangle(x, y, w + 8, h + 8, machine.color, 0.08);
        this.tweens.add({
            targets: glow,
            alpha: { from: 0.05, to: 0.18 },
            duration: 1400, yoyo: true, repeat: -1,
        });

        // Icon mesin besar (placeholder — ganti dengan sprite nanti)
        const iconBg = this.add.circle(x, y - 40, 70, machine.color, 0.15)
            .setStrokeStyle(2, machine.borderColor);

        const icon = this.add.text(x, y - 40, machine.icon, {
            fontFamily: 'monospace', fontSize: '52px',
        }).setOrigin(0.5);

        // Animasi idle mesin
        this.tweens.add({
            targets: icon,
            y: y - 44,
            duration: 1200,
            ease: 'Sine.easeInOut',
            yoyo: true, repeat: -1,
        });

        // Nama mesin
        this.add.text(x, y + 52, machine.name, {
            fontFamily: 'monospace', fontSize: '16px',
            color: '#ccddee', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(x, y + 74, machine.subtitle, {
            fontFamily: 'monospace', fontSize: '10px', color: '#445566',
        }).setOrigin(0.5);

        // Pity info
        const pityKey     = `pity${machine.id.charAt(0).toUpperCase() + machine.id.slice(1)}`;
        const pityCount   = this.meta[pityKey] || 0;
        const pityToMythic = 50 - (pityCount % 50);

        this.add.text(x, y + 96, `Mythic dalam ${pityToMythic} pull`, {
            fontFamily: 'monospace', fontSize: '9px', color: '#334455',
        }).setOrigin(0.5);

        // Rate info
        this.add.text(x, y + 112,
            'Common 50% · Rare 30% · Ancient 15% · Mythic 4% · Divine 1%', {
                fontFamily: 'monospace', fontSize: '8px', color: '#223344',
                align: 'center', wordWrap: { width: w - 20 },
            }).setOrigin(0.5);

        // Simpan referensi icon untuk animasi pull
        machine._icon = icon;
        machine._iconBg = iconBg;
        machine._panel = panel;
    }

    // ── Pull Buttons ──────────────────────────────────────────
    _buildPullButtons() {
        MACHINES.forEach(machine => {
            const x  = machine.x;
            const y1 = 480;
            const y2 = 528;

            // 1x pull
            const btn1Bg = this.add.rectangle(x, y1, 200, 36, 0x111122)
                .setStrokeStyle(1, machine.borderColor)
                .setInteractive({ useHandCursor: true });
            const btn1Txt = this.add.text(x, y1,
                `1x Pull  —  🪬 ${MAGATAMA_COST.PULL_SINGLE}`, {
                    fontFamily: 'monospace', fontSize: '12px', color: '#778899',
                }).setOrigin(0.5);

            btn1Bg.on('pointerover', () => { btn1Bg.setFillStyle(0x1a1a33); btn1Txt.setColor('#aabbcc'); });
            btn1Bg.on('pointerout',  () => { btn1Bg.setFillStyle(0x111122); btn1Txt.setColor('#778899'); });
            btn1Bg.on('pointerdown', () => this._doPull(machine, 1));

            // 10x pull
            const btn10Bg = this.add.rectangle(x, y2, 200, 36, 0x1a1100)
                .setStrokeStyle(1, 0xaa7722)
                .setInteractive({ useHandCursor: true });
            const btn10Txt = this.add.text(x, y2,
                `10x Pull  —  🪬 ${MAGATAMA_COST.PULL_TEN}`, {
                    fontFamily: 'monospace', fontSize: '12px', color: '#aa7722',
                }).setOrigin(0.5);

            btn10Bg.on('pointerover', () => { btn10Bg.setFillStyle(0x221a00); btn10Txt.setColor('#ffcc44'); });
            btn10Bg.on('pointerout',  () => { btn10Bg.setFillStyle(0x1a1100); btn10Txt.setColor('#aa7722'); });
            btn10Bg.on('pointerdown', () => this._doPull(machine, 10));

            machine._btn1Bg  = btn1Bg;
            machine._btn10Bg = btn10Bg;
        });
    }

    // ── Result Area ───────────────────────────────────────────
    _buildResultArea() {
        this.resultContainer = this.add.container(GAME_WIDTH / 2, 610);

        this.resultHint = this.add.text(GAME_WIDTH / 2, 610,
            'Pilih mesin dan mulai pull!', {
                fontFamily: 'monospace', fontSize: '12px', color: '#223344',
            }).setOrigin(0.5);
    }

    // ── Back Button ───────────────────────────────────────────
    _buildBackButton() {
        const bg = this.add.rectangle(80, GAME_HEIGHT - 34, 130, 28, 0x0d0d1a)
            .setStrokeStyle(1, 0x222233)
            .setInteractive({ useHandCursor: true });
        const txt = this.add.text(80, GAME_HEIGHT - 34, '← Kembali', {
            fontFamily: 'monospace', fontSize: '11px', color: '#334455',
        }).setOrigin(0.5);

        bg.on('pointerover', () => txt.setColor('#556677'));
        bg.on('pointerout',  () => txt.setColor('#334455'));
        bg.on('pointerdown', () => this.scene.start(SCENE.MAIN_MENU));
    }

    // ── Owned Preview ─────────────────────────────────────────
    _buildOwnedPreview() {
        const ownedCompanions = (this.meta.ownedCompanions || []).length;
        const ownedPets       = (this.meta.ownedPets       || []).length;
        const totalCompanions = getAllCompanions().length;
        const totalPets       = getAllPets().length;

        this.add.text(GAME_WIDTH / 2 - 220, 568,
            `Companion: ${ownedCompanions}/${totalCompanions}`, {
                fontFamily: 'monospace', fontSize: '9px', color: '#334455',
            }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2 + 220, 568,
            `Pet: ${ownedPets}/${totalPets}`, {
                fontFamily: 'monospace', fontSize: '9px', color: '#334455',
            }).setOrigin(0.5);
    }

    // ── Pull Logic ────────────────────────────────────────────

    _doPull(machine, count) {
        if (this._animating) return;

        const isTen  = count === 10;
        const cost   = isTen ? MAGATAMA_COST.PULL_TEN : MAGATAMA_COST.PULL_SINGLE;
        const result = MagatamaSystem.spend(cost);

        if (!result.success) {
            this._showNotEnough();
            return;
        }

        this._animating = true;
        this.magatama   = result.balance;
        this.magatamaTxt.setText(`🪬 ${this.magatama} Magatama`);

        // Disable semua tombol
        MACHINES.forEach(m => {
            m._btn1Bg?.disableInteractive();
            m._btn10Bg?.disableInteractive();
        });

        // Roll hasil
        const results = [];
        for (let i = 0; i < count; i++) {
            const item = this._rollOne(machine, i === count - 1 && isTen);
            results.push(item);
        }

        // Animasi mesin berputar → reveal
        this._animateMachine(machine, results);
    }

    _rollOne(machine, isLastOfTen = false) {
        // Update pity
        const pityKey = `pity${machine.id.charAt(0).toUpperCase() + machine.id.slice(1)}`;
        this.meta[pityKey] = (this.meta[pityKey] || 0) + 1;

        // Check pity guarantee
        let rarity;
        if (this.meta[pityKey] >= 100) {
            rarity = 'divine';
            this.meta[pityKey] = 0;
        } else if (this.meta[pityKey] >= 50) {
            rarity = Math.random() < 0.5 ? 'mythic' : _rollRarity();
            if (rarity === 'divine' || rarity === 'mythic') this.meta[pityKey] = 0;
        } else {
            rarity = _rollRarity();
            // 10x pull: guaranteed minimal rare di pull terakhir
            if (isLastOfTen && ['common'].includes(rarity)) {
                rarity = 'rare';
            }
        }

        // Pilih item dari pool
        const pool     = this._getPool(machine.id, rarity);
        const owned    = machine.id === 'companion'
            ? (this.meta.ownedCompanions || [])
            : (this.meta.ownedPets || []);

        // Prioritaskan yang belum dimiliki
        const unowned = pool.filter(item => !owned.includes(item.id));
        const source  = unowned.length > 0 ? unowned : pool;
        const item    = source[Math.floor(Math.random() * source.length)];

        // Simpan ke meta kalau belum punya
        if (item && !owned.includes(item.id)) {
            if (machine.id === 'companion') {
                this.meta.ownedCompanions = [...(this.meta.ownedCompanions || []), item.id];
            } else {
                this.meta.ownedPets = [...(this.meta.ownedPets || []), item.id];
            }
        }

        return { item, rarity, isDuplicate: item ? owned.includes(item.id) : false };
    }

    _getPool(machineId, rarity) {
        if (machineId === 'companion') {
            return getAllCompanions().filter(c => c.rarity === rarity);
        } else {
            return getAllPets().filter(p => p.rarity === rarity);
        }
    }

    // ── Animation ─────────────────────────────────────────────

    _animateMachine(machine, results) {
        // Clear result area
        this.resultContainer.removeAll(true);
        this.resultHint?.setVisible(false);

        // 1. Getarkan mesin
        this.tweens.add({
            targets:  machine._icon,
            x:        machine.x + 6,
            duration: 60,
            repeat:   6,
            yoyo:     true,
            onComplete: () => {
                // 2. Flash mesin
                this.tweens.add({
                    targets:  machine._panel,
                    alpha:    { from: 1, to: 0.3 },
                    duration: 80,
                    repeat:   3,
                    yoyo:     true,
                    onComplete: () => {
                        // 3. Kapsul keluar (animasi bola jatuh)
                        this._animateCapsule(machine, results);
                    },
                });
            },
        });
    }

    _animateCapsule(machine, results) {
        const cx = machine.x;

        // Bola kapsul keluar dari mesin
        const capsule = this.add.circle(cx, 160, 28, 0xcccccc)
            .setStrokeStyle(3, 0xffffff);

        const capsuleInner = this.add.text(cx, 160, '?', {
            fontFamily: 'monospace', fontSize: '24px', color: '#ffffff',
        }).setOrigin(0.5);

        // Animasi jatuh
        this.tweens.add({
            targets:  [capsule, capsuleInner],
            y:        420,
            duration: 500,
            ease:     'Bounce.Out',
            onComplete: () => {
                // 4. Kapsul terbuka → reveal
                this.time.delayedCall(200, () => {
                    capsule.destroy();
                    capsuleInner.destroy();
                    this._showResults(machine, results);
                });
            },
        });
    }

    _showResults(machine, results) {
        // Untuk 1 pull: tampilkan satu kartu besar di tengah
        // Untuk 10 pull: tampilkan grid 10 kartu kecil

        const isSingle = results.length === 1;

        if (isSingle) {
            this._showSingleResult(machine, results[0]);
        } else {
            this._showMultiResult(machine, results);
        }

        // Simpan meta
        SaveSystem.saveMeta(this.meta);

        // Re-enable tombol setelah delay
        this.time.delayedCall(isSingle ? 2000 : 3000, () => {
            this._animating = false;
            MACHINES.forEach(m => {
                m._btn1Bg?.setInteractive({ useHandCursor: true });
                m._btn10Bg?.setInteractive({ useHandCursor: true });
            });
            this.resultHint?.setVisible(true);
        });
    }

    _showSingleResult(machine, result) {
        if (!result.item) return;

        const { item, rarity, isDuplicate } = result;
        const rarityColor = RARITY_GLOW[rarity] || 0x888888;
        const cx          = GAME_WIDTH / 2;
        const cy          = 610;

        // Glow besar
        const glow = this.add.circle(cx, cy, 80, rarityColor, 0.15);
        this.tweens.add({
            targets: glow,
            scale: { from: 0.5, to: 1.4 },
            alpha: { from: 0.3,  to: 0   },
            duration: 800,
        });

        // Card hasil
        const card = this.add.rectangle(cx, cy, 180, 90, 0x0d0d18)
            .setStrokeStyle(2, rarityColor)
            .setAlpha(0);

        const iconTxt = this.add.text(cx - 60, cy - 12, item.icon || item.element || '?', {
            fontFamily: 'monospace', fontSize: '28px',
        }).setOrigin(0.5).setAlpha(0);

        const nameTxt = this.add.text(cx + 10, cy - 14, item.name, {
            fontFamily: 'monospace', fontSize: '13px',
            color: '#ccddee', fontStyle: 'bold',
        }).setOrigin(0, 0.5).setAlpha(0);

        const rarityTxt = this.add.text(cx + 10, cy + 4,
            RARITY_LABEL[rarity] || rarity, {
                fontFamily: 'monospace', fontSize: '10px',
                color: '#' + rarityColor.toString(16).padStart(6, '0'),
            }).setOrigin(0, 0.5).setAlpha(0);

        const dupTxt = isDuplicate
            ? this.add.text(cx + 10, cy + 20, '(sudah dimiliki)', {
                fontFamily: 'monospace', fontSize: '9px', color: '#445566',
              }).setOrigin(0, 0.5).setAlpha(0)
            : null;

        // Animasi muncul
        this.tweens.add({
            targets:  [card, iconTxt, nameTxt, rarityTxt, dupTxt].filter(Boolean),
            alpha:    1,
            duration: 400,
            ease:     'Back.Out',
        });
    }

    _showMultiResult(machine, results) {
        // Grid 5x2 untuk 10 hasil
        const cols   = 5;
        const cardW  = 120, cardH = 60;
        const gap    = 8;
        const startX = GAME_WIDTH / 2 - (cols * (cardW + gap)) / 2 + cardW / 2;
        const startY = 580;

        results.forEach((result, i) => {
            if (!result.item) return;

            const col = i % cols;
            const row = Math.floor(i / cols);
            const x   = startX + col * (cardW + gap);
            const y   = startY + row * (cardH + gap);

            const { item, rarity, isDuplicate } = result;
            const rarityColor = RARITY_GLOW[rarity] || 0x888888;

            const card = this.add.rectangle(x, y, cardW, cardH, 0x0d0d18)
                .setStrokeStyle(1, rarityColor)
                .setAlpha(0);

            const iconTxt = this.add.text(x - cardW / 2 + 18, y - 6,
                item.icon || '?', {
                    fontFamily: 'monospace', fontSize: '18px',
                }).setOrigin(0.5).setAlpha(0);

            const nameTxt = this.add.text(x - cardW / 2 + 36, y - 8,
                item.name, {
                    fontFamily: 'monospace', fontSize: '9px',
                    color: isDuplicate ? '#445566' : '#aabbcc',
                    wordWrap: { width: cardW - 40 },
                }).setOrigin(0, 0.5).setAlpha(0);

            const rarTxt = this.add.text(x - cardW / 2 + 36, y + 10,
                RARITY_LABEL[rarity] || rarity, {
                    fontFamily: 'monospace', fontSize: '8px',
                    color: '#' + rarityColor.toString(16).padStart(6, '0'),
                }).setOrigin(0, 0.5).setAlpha(0);

            // Muncul satu per satu dengan delay
            this.time.delayedCall(i * 120, () => {
                this.tweens.add({
                    targets:  [card, iconTxt, nameTxt, rarTxt],
                    alpha:    1,
                    duration: 250,
                    ease:     'Back.Out',
                });
            });
        });
    }

    // ── Notif ─────────────────────────────────────────────────
    _showNotEnough() {
        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 
            `Magatama tidak cukup!\nPerlu 🪬 ${MAGATAMA_COST.PULL_SINGLE} untuk 1x pull`, {
                fontFamily: 'monospace', fontSize: '16px',
                color: '#cc4444', fontStyle: 'bold',
                align: 'center',
                backgroundColor: '#0d0d1a', padding: { x: 16, y: 10 },
            }).setOrigin(0.5).setDepth(10).setAlpha(0);

        this.tweens.add({
            targets: txt, alpha: 1, duration: 200,
            onComplete: () => {
                this.time.delayedCall(1800, () => {
                    this.tweens.add({ targets: txt, alpha: 0, duration: 300,
                        onComplete: () => txt.destroy() });
                });
            },
        });
    }
}

// ── Helpers ───────────────────────────────────────────────────
function _rollRarity() {
    const pool = [];
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
        for (let i = 0; i < weight; i++) pool.push(rarity);
    }
    return pool[Math.floor(Math.random() * pool.length)];
}