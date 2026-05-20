// ============================================================
// ShrineScene.js — layar Shrine Node
// Player taruhan HP atau gold untuk dapat buff permanen/sementara
// Ada risiko — bisa untung bisa rugi
// ============================================================

import { SCENE, GAME_WIDTH, GAME_HEIGHT, STAT } from '../config/constants.js';

// Pool semua pilihan shrine
const SHRINE_OPTIONS = [

    // ── Buff Kuat (risiko tinggi) ─────────────────────────────
    {
        id:      'perjanjian_darah',
        title:   '🩸 Perjanjian Darah',
        desc:    'Bayar 25% HP max. Semua damage +30% permanen untuk run ini.',
        risk:    'HP max berkurang permanen 25%.',
        cost:    { type: 'hp_percent', value: 25 },
        benefit: { type: 'damage_bonus_perm', value: 30 },
        rarity:  'rare',
    },
    {
        id:      'jiwa_pejuang',
        title:   '⚔️ Jiwa Pejuang',
        desc:    'Bayar 150 gold. STR +5 permanen.',
        risk:    'Kehilangan 150 gold.',
        cost:    { type: 'gold', value: 150 },
        benefit: { type: 'stat_str', value: 5 },
        rarity:  'rare',
    },
    {
        id:      'berkah_naga',
        title:   '🐉 Berkah Naga',
        desc:    'Bayar 200 gold. HP max +40 permanen.',
        risk:    'Kehilangan 200 gold.',
        cost:    { type: 'gold', value: 200 },
        benefit: { type: 'hp_max', value: 40 },
        rarity:  'rare',
    },

    // ── Buff Medium (risiko medium) ───────────────────────────
    {
        id:      'api_semangat',
        title:   '🔥 Api Semangat',
        desc:    'Bayar 15% HP. Energi per turn +1 permanen.',
        risk:    'HP berkurang 15% dari max.',
        cost:    { type: 'hp_percent', value: 15 },
        benefit: { type: 'energy_bonus', value: 1 },
        rarity:  'uncommon',
    },
    {
        id:      'cahaya_bulan',
        title:   '🌙 Cahaya Bulan',
        desc:    'Bayar 100 gold. AGI +4 dan dodge rate naik.',
        risk:    'Kehilangan 100 gold.',
        cost:    { type: 'gold', value: 100 },
        benefit: { type: 'stat_agi', value: 4 },
        rarity:  'uncommon',
    },
    {
        id:      'kebijakan_tua',
        title:   '📚 Kebijakan Tua',
        desc:    'Bayar 100 gold. INT +4 permanen.',
        risk:    'Kehilangan 100 gold.',
        cost:    { type: 'gold', value: 100 },
        benefit: { type: 'stat_int', value: 4 },
        rarity:  'uncommon',
    },
    {
        id:      'perlindungan_kodama',
        title:   '🌿 Perlindungan Kodama',
        desc:    'Bayar 10% HP. Pulihkan HP penuh sekali per lantai boss.',
        risk:    'HP berkurang 10% dari max.',
        cost:    { type: 'hp_percent', value: 10 },
        benefit: { type: 'boss_heal', value: 1 },
        rarity:  'uncommon',
    },

    // ── Buff Ringan (risiko rendah) ───────────────────────────
    {
        id:      'berkah_pedagang',
        title:   '💰 Berkah Pedagang',
        desc:    'Bayar 50 gold. Harga shop -20% untuk sisa run.',
        risk:    'Kehilangan 50 gold.',
        cost:    { type: 'gold', value: 50 },
        benefit: { type: 'shop_discount', value: 20 },
        rarity:  'common',
    },
    {
        id:      'sentuhan_kitsune',
        title:   '🦊 Sentuhan Kitsune',
        desc:    'Bayar 5% HP. Tarik 1 kartu ekstra setiap awal combat.',
        risk:    'HP berkurang sedikit.',
        cost:    { type: 'hp_percent', value: 5 },
        benefit: { type: 'extra_draw_perm', value: 1 },
        rarity:  'common',
    },
    {
        id:      'semangat_ronin',
        title:   '🗡️ Semangat Ronin',
        desc:    'Bayar 75 gold. Block tidak hilang di awal giliran sekali per combat.',
        risk:    'Kehilangan 75 gold.',
        cost:    { type: 'gold', value: 75 },
        benefit: { type: 'block_persist_once', value: 1 },
        rarity:  'common',
    },

    // ── Gamble (acak — bisa untung bisa rugi) ────────────────
    {
        id:      'dadu_iblis',
        title:   '🎲 Dadu Iblis',
        desc:    'Korbankan semua gold. 50% dapat buff besar, 50% tidak dapat apa-apa.',
        risk:    'Kehilangan SEMUA gold. Hasilnya tidak pasti.',
        cost:    { type: 'all_gold', value: 0 },
        benefit: { type: 'gamble', value: 0 },
        rarity:  'gamble',
    },
    {
        id:      'cobaan_nasib',
        title:   '☯️ Cobaan Nasib',
        desc:    'Tidak ada biaya. Tapi hasilnya bisa baik atau buruk — tidak bisa diprediksi.',
        risk:    'Bisa dapat debuff besar.',
        cost:    { type: 'none', value: 0 },
        benefit: { type: 'fate', value: 0 },
        rarity:  'gamble',
    },
];

export class ShrineScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.SHRINE });
    }

    init(data) {
        this.zone          = data.zone          || 1;
        this.floor         = data.floor         || 1;
        this.curseLevel    = data.curseLevel    || 1;
        this.playerData    = data.playerData    || null;
        this.mapData       = data.mapData       || null;
        this.currentNodeId = data.currentNodeId || 'start';

        // Pilih 3 opsi shrine secara acak
        this.options = this._pickOptions();
        this.chosen  = false;
    }

    create() {
        this._buildBackground();
        this._buildHeader();
        this._buildOptions();
        this._buildLeaveButton();
    }

    // ── UI ────────────────────────────────────────────────────

    _buildBackground() {
        this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT, 0x06060d
        );

        // Efek partikel sederhana — titik-titik bersinar
        const g = this.add.graphics();
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * GAME_WIDTH;
            const y = Math.random() * GAME_HEIGHT;
            const r = Math.random() * 1.5;
            g.fillStyle(0xaa44cc, Math.random() * 0.4 + 0.1);
            g.fillCircle(x, y, r);
        }

        // Panel
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 860, 520, 0x0d0814)
            .setStrokeStyle(1, 0x331144);
    }

    _buildHeader() {
        this.add.text(GAME_WIDTH / 2, 95, '🔱  ALTAR MISTIS  🔱', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#553366', letterSpacing: 4,
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 130, 'Shrine', {
            fontFamily: 'monospace', fontSize: '38px',
            color: '#9944cc', fontStyle: 'bold',
            stroke: '#220033', strokeThickness: 4,
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 175,
            'Altar kuno ini menawarkan kekuatan — dengan harga yang setimpal.', {
            fontFamily: 'monospace', fontSize: '13px',
            color: '#445566', fontStyle: 'italic',
        }).setOrigin(0.5);

        // Info gold & HP player
        if (this.playerData) {
            const hp    = this.playerData.hp    || 0;
            const hpMax = this.playerData.stats?.hp_max || 100;
            const gold  = this.playerData.gold  || 0;
            this.add.text(GAME_WIDTH / 2, 205,
                `❤ ${hp}/${hpMax}   💰 ${gold}`, {
                fontFamily: 'monospace', fontSize: '12px', color: '#446655',
            }).setOrigin(0.5);
        }
    }

    _buildOptions() {
        const startY  = 260;
        const spacing = 130;

        this.options.forEach((opt, i) => {
            const y = startY + i * spacing;
            this._createOption(opt, GAME_WIDTH / 2, y, i);
        });
    }

    _createOption(opt, x, y, index) {
        const w = 700, h = 110;

        const rarityColors = {
            common:   0x223322,
            uncommon: 0x222233,
            rare:     0x221133,
            gamble:   0x221100,
        };
        const rarityBorder = {
            common:   0x334433,
            uncommon: 0x333366,
            rare:     0x663366,
            gamble:   0x664422,
        };

        const bg = this.add.rectangle(x, y, w, h,
            rarityColors[opt.rarity] || 0x111122
        ).setStrokeStyle(1, rarityBorder[opt.rarity] || 0x222244)
         .setInteractive({ useHandCursor: true });

        // Judul
        this.add.text(x - w/2 + 20, y - 38, opt.title, {
            fontFamily: 'monospace', fontSize: '16px',
            color: '#aabbcc', fontStyle: 'bold',
        });

        // Deskripsi
        this.add.text(x - w/2 + 20, y - 12, opt.desc, {
            fontFamily: 'monospace', fontSize: '12px', color: '#667788',
            wordWrap: { width: w - 180 },
        });

        // Risiko
        this.add.text(x - w/2 + 20, y + 28, `⚠ ${opt.risk}`, {
            fontFamily: 'monospace', fontSize: '10px', color: '#884444',
        });

        // Cost display di kanan
        const costStr = this._costStr(opt);
        const canAfford = this._canAfford(opt);
        this.add.text(x + w/2 - 20, y, costStr, {
            fontFamily: 'monospace', fontSize: '14px',
            color: canAfford ? '#cc8833' : '#442222',
            fontStyle: 'bold',
        }).setOrigin(1, 0.5);

        // Hover
        bg.on('pointerover', () => {
            if (!this.chosen && canAfford) {
                bg.setFillStyle((rarityColors[opt.rarity] || 0x111122) + 0x050505);
                bg.setStrokeStyle(2, rarityBorder[opt.rarity] || 0x222244);
            }
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(rarityColors[opt.rarity] || 0x111122);
            bg.setStrokeStyle(1, rarityBorder[opt.rarity] || 0x222244);
        });

        // Klik
        bg.on('pointerdown', () => {
            if (this.chosen) return;
            if (!canAfford) {
                this._showMsg('Tidak cukup resource!', '#cc4444');
                return;
            }
            this._applyOption(opt, bg);
        });

        if (!canAfford) {
            bg.disableInteractive();
            bg.setAlpha(0.4);
        }
    }

    _buildLeaveButton() {
        const bx = GAME_WIDTH / 2;
        const by = GAME_HEIGHT - 55;

        const bg = this.add.rectangle(bx, by, 220, 36, 0x0d0d1a)
            .setStrokeStyle(1, 0x1e1e2e)
            .setInteractive({ useHandCursor: true });
        const txt = this.add.text(bx, by, '← Tinggalkan Altar', {
            fontFamily: 'monospace', fontSize: '13px', color: '#334455',
        }).setOrigin(0.5);

        bg.on('pointerover', () => txt.setColor('#556677'));
        bg.on('pointerout',  () => txt.setColor('#334455'));
        bg.on('pointerdown', () => this._leave());
    }

    // ── Logic ─────────────────────────────────────────────────

    _applyOption(opt, bg) {
        this.chosen = true;
        bg.setStrokeStyle(2, 0xffcc44);

        // Bayar cost
        this._payCost(opt);

        // Apply benefit
        const result = this._applyBenefit(opt);

        this._showMsg(result.msg, result.color);

        this.time.delayedCall(1800, () => this._leave());
    }

    _payCost(opt) {
        if (!this.playerData) return;
        const p = this.playerData;

        switch (opt.cost.type) {
            case 'hp_percent':
                const dmg = Math.floor((p.stats?.hp_max || 100) * opt.cost.value / 100);
                p.hp = Math.max(1, (p.hp || 1) - dmg);
                break;
            case 'gold':
                p.gold = Math.max(0, (p.gold || 0) - opt.cost.value);
                break;
            case 'all_gold':
                p.gold = 0;
                break;
        }
    }

    _applyBenefit(opt) {
        const p = this.playerData;
        if (!p) return { msg: 'Berkah diterima.', color: '#aabbcc' };

        switch (opt.benefit.type) {
            case 'damage_bonus_perm':
                p._damageBonusPerm = (p._damageBonusPerm || 0) + opt.benefit.value;
                return { msg: `✦ Damage +${opt.benefit.value}% permanen!`, color: '#cc4444' };

            case 'stat_str':
                if (p.baseStats) p.baseStats.str = (p.baseStats.str || 0) + opt.benefit.value;
                return { msg: `✦ STR +${opt.benefit.value}!`, color: '#cc8833' };

            case 'stat_int':
                if (p.baseStats) p.baseStats.int = (p.baseStats.int || 0) + opt.benefit.value;
                return { msg: `✦ INT +${opt.benefit.value}!`, color: '#8833cc' };

            case 'stat_agi':
                if (p.baseStats) p.baseStats.agi = (p.baseStats.agi || 0) + opt.benefit.value;
                return { msg: `✦ AGI +${opt.benefit.value}!`, color: '#33aacc' };

            case 'hp_max':
                if (p.stats) p.stats.hp_max = (p.stats.hp_max || 100) + opt.benefit.value;
                p.hp = Math.min(p.hp || 0, p.stats?.hp_max || 100);
                return { msg: `✦ HP max +${opt.benefit.value}!`, color: '#44cc44' };

            case 'energy_bonus':
                p._energyBonusPerm = (p._energyBonusPerm || 0) + opt.benefit.value;
                return { msg: `✦ Energi per turn +${opt.benefit.value}!`, color: '#ffcc44' };

            case 'extra_draw_perm':
                p._extraDraw = (p._extraDraw || 0) + opt.benefit.value;
                return { msg: `✦ Tarik +${opt.benefit.value} kartu tiap combat!`, color: '#44aacc' };

            case 'shop_discount':
                p._shopDiscount = (p._shopDiscount || 0) + opt.benefit.value;
                return { msg: `✦ Harga shop -${opt.benefit.value}%!`, color: '#44aacc' };

            case 'gamble': {
                if (Math.random() < 0.5) {
                    // Untung
                    if (p.baseStats) p.baseStats.str = (p.baseStats.str || 0) + 3;
                    if (p.baseStats) p.baseStats.int = (p.baseStats.int || 0) + 3;
                    return { msg: '🎲 Beruntung! STR +3 dan INT +3!', color: '#ffcc44' };
                } else {
                    return { msg: '🎲 Nasib buruk... tidak ada yang didapat.', color: '#cc4444' };
                }
            }

            case 'fate': {
                const roll = Math.random();
                if (roll < 0.4) {
                    // Buff
                    const healAmt = Math.floor((p.stats?.hp_max || 100) * 0.3);
                    p.hp = Math.min(p.stats?.hp_max || 100, (p.hp || 0) + healAmt);
                    return { msg: `☯️ Nasib baik! HP +${healAmt}!`, color: '#44cc88' };
                } else if (roll < 0.7) {
                    // Netral
                    return { msg: '☯️ Nasib netral. Tidak ada perubahan.', color: '#778899' };
                } else {
                    // Debuff
                    const dmg = Math.floor((p.stats?.hp_max || 100) * 0.2);
                    p.hp = Math.max(1, (p.hp || 1) - dmg);
                    return { msg: `☯️ Nasib buruk! HP -${dmg}!`, color: '#cc4444' };
                }
            }

            default:
                return { msg: '✦ Berkah misterius diterima.', color: '#aabbcc' };
        }
    }

    _canAfford(opt) {
        if (!this.playerData) return false;
        const p = this.playerData;

        switch (opt.cost.type) {
            case 'none':     return true;
            case 'all_gold': return true;
            case 'gold':     return (p.gold || 0) >= opt.cost.value;
            case 'hp_percent': {
                const dmg = Math.floor((p.stats?.hp_max || 100) * opt.cost.value / 100);
                return (p.hp || 0) - dmg > 0;
            }
            default: return true;
        }
    }

    _costStr(opt) {
        switch (opt.cost.type) {
            case 'none':       return 'Gratis';
            case 'all_gold':   return `💰 Semua gold\n(${this.playerData?.gold || 0})`;
            case 'gold':       return `💰 ${opt.cost.value}`;
            case 'hp_percent': return `❤ -${opt.cost.value}% HP`;
            default: return '';
        }
    }

    _showMsg(msg, color) {
        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, msg, {
            fontFamily: 'monospace', fontSize: '20px',
            color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(10).setAlpha(0);

        this.tweens.add({
            targets: txt, alpha: 1, y: GAME_HEIGHT / 2 - 40,
            duration: 400,
        });
    }

    _pickOptions() {
        const shuffled = [...SHRINE_OPTIONS].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3);
    }

    _leave() {
        this.scene.start(SCENE.NODE_MAP, {
            zone:          this.zone,
            floor:         this.floor,
            curseLevel:    this.curseLevel,
            playerData:    this.playerData,
            mapData:       this.mapData,
            currentNodeId: this.currentNodeId,
        });
    }
}