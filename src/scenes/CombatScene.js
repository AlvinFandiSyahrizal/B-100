// ============================================================
// CombatScene.js — layar pertarungan utama
// Phase 1: functional, UI masih sederhana (placeholder)
// ============================================================

import {
    SCENE, GAME_WIDTH, GAME_HEIGHT,
    ENERGY_PER_TURN, HAND_SIZE, STAT
} from '../config/constants.js';
import { Player }        from '../entities/Player.js';
import { Monster }       from '../entities/Monster.js';
import { CombatSystem, COMBAT_STATE } from '../systems/CombatSystem.js';
import { DeckSystem }    from '../systems/DeckSystem.js';
import { getMonster, getZoneMonsterPool } from '../data/monsters/index.js';
import { STARTER_DECK }  from '../data/cards/index.js';

export class CombatScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.COMBAT });
    }

    init(data) {
        this.floor         = data.floor         || 1;
        this.curseLevel    = data.curseLevel    || 1;
        this.zone          = data.zone          || Math.ceil(this.floor / 10);
        this.isBoss        = data.isBoss        || false;
        this.mapData       = data.mapData       || null;
        this.currentNodeId = data.currentNodeId || 'start';

        // Restore player dari data kalau ada, buat baru kalau tidak
        if (data.playerData) {
            this.player = Player.fromJSON(data.playerData);
        } else {
            this.player = new Player({ curseLevel: this.curseLevel });
            this.player.initStarterDeck(
                DeckSystem.buildDeckFromIds(STARTER_DECK)
            );
        }
    }

    create() {
        // Spawn monster sesuai zona
        const pool        = getZoneMonsterPool(this.zone);
        const monsterId   = pool[Math.floor(Math.random() * pool.length)];
        const monsterData = getMonster(monsterId) || getMonster('kappa');
        this.monsters     = [ new Monster(monsterData, this.floor) ];

        // ── Combat engine ─────────────────────────────────────
        this.combat = new CombatSystem(this.player, this.monsters);
        this.combat.start();

        // ── Build UI ──────────────────────────────────────────
        this._buildBackground();
        this._buildMonsterArea();
        this._buildPlayerArea();
        this._buildHandArea();
        this._buildHUD();

        // ── Refresh UI ────────────────────────────────────────
        this._refreshUI();

        // ── Input: End Turn ───────────────────────────────────
        this._createEndTurnButton();
    }

    // ── Build UI ──────────────────────────────────────────────

    _buildBackground() {
        // Background gelap
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080810);

        // Garis-garis horisontal tipis
        const g = this.add.graphics();
        g.lineStyle(1, 0x111122, 0.5);
        for (let y = 0; y < GAME_HEIGHT; y += 32) {
            g.moveTo(0, y); g.lineTo(GAME_WIDTH, y);
        }
        g.strokePath();

        // Label lantai
        this.add.text(GAME_WIDTH / 2, 20, `B${this.floor}  —  Zona ${this.zone}`, {
            fontFamily: 'monospace',
            fontSize:   '14px',
            color:      '#444466',
        }).setOrigin(0.5, 0);
    }

    _buildMonsterArea() {
        // Area tengah atas untuk monster
        this.monsterSprites = [];
        this.monsterHpBars  = [];
        this.monsterHpTexts = [];
        this.monsterNameTexts = [];
        this.monsterIntentIcons = [];

        const startX = GAME_WIDTH / 2 - (this.monsters.length - 1) * 120;

        this.monsters.forEach((monster, i) => {
            const x = startX + i * 240;
            const y = 240;

            // Sprite placeholder
            const spr = this.add.image(x, y, monster.spriteKey)
                .setScale(3)
                .setOrigin(0.5);
            this.monsterSprites.push(spr);

            // HP bar background
            this.add.rectangle(x, y + 80, 120, 14, 0x220000).setOrigin(0.5);
            // HP bar fill
            const bar = this.add.rectangle(x - 59, y + 80, 118, 12, 0xcc2222).setOrigin(0, 0.5);
            this.monsterHpBars.push(bar);

            // HP text
            const hpTxt = this.add.text(x, y + 80, '', {
                fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
            }).setOrigin(0.5);
            this.monsterHpTexts.push(hpTxt);

            // Name
            const nameTxt = this.add.text(x, y + 95, monster.name, {
                fontFamily: 'monospace', fontSize: '13px', color: '#cc8833',
            }).setOrigin(0.5);
            this.monsterNameTexts.push(nameTxt);

            // Intent icon
            const intentTxt = this.add.text(x, y - 80, '', {
                fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
            }).setOrigin(0.5);
            this.monsterIntentIcons.push(intentTxt);
        });
    }

    _buildPlayerArea() {
        // HP bar player (bawah kiri)
        const px = 180, py = GAME_HEIGHT - 180;

        this.add.text(px, py - 50, 'PLAYER', {
            fontFamily: 'monospace', fontSize: '12px', color: '#6666aa',
        }).setOrigin(0.5);

        // HP bar bg
        this.add.rectangle(px, py - 30, 200, 18, 0x220000).setOrigin(0.5);
        this.playerHpBar = this.add.rectangle(px - 99, py - 30, 198, 16, 0x44cc44).setOrigin(0, 0.5);
        this.playerHpText = this.add.text(px, py - 30, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
        }).setOrigin(0.5);

        // Block
        this.playerBlockText = this.add.text(px, py - 8, '', {
            fontFamily: 'monospace', fontSize: '12px', color: '#4488cc',
        }).setOrigin(0.5);

        // Energy
        this.energyText = this.add.text(px, py + 10, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#cc8833',
        }).setOrigin(0.5);

        // Player sprite placeholder
        this.add.image(px, py - 90, 'player').setScale(3).setOrigin(0.5);

        // Status effects area
        this.playerStatusText = this.add.text(px, py + 30, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#aa6666',
        }).setOrigin(0.5);
    }

    _buildHandArea() {
        // Area kartu di bawah
        this.cardObjects = [];
        this._renderHand();
    }

    _buildHUD() {
        // Deck & Discard counter
        this.deckText    = this.add.text(GAME_WIDTH - 60, GAME_HEIGHT - 60, '', {
            fontFamily: 'monospace', fontSize: '13px', color: '#556677',
        }).setOrigin(0.5);

        this.discardText = this.add.text(60, GAME_HEIGHT - 60, '', {
            fontFamily: 'monospace', fontSize: '13px', color: '#557766',
        }).setOrigin(0.5);

        // Turn indicator
        this.turnText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 15, '', {
            fontFamily: 'monospace', fontSize: '12px', color: '#333355',
        }).setOrigin(0.5);
    }

    _createEndTurnButton() {
        const bx = GAME_WIDTH - 120;
        const by = GAME_HEIGHT - 120;

        const bg = this.add.rectangle(bx, by, 140, 44, 0x1a1a3a)
            .setInteractive({ useHandCursor: true });

        this.add.graphics()
            .lineStyle(1, 0x3344aa, 1)
            .strokeRect(bx - 70, by - 22, 140, 44);

        this.endTurnText = this.add.text(bx, by, 'END TURN', {
            fontFamily: 'monospace', fontSize: '14px', color: '#6688cc',
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x2a2a5a);
            this.endTurnText.setColor('#aabbff');
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x1a1a3a);
            this.endTurnText.setColor('#6688cc');
        });

        bg.on('pointerdown', () => {
            if (this.combat.state === COMBAT_STATE.PLAYER_TURN) {
                this._doEndTurn();
            }
        });
    }

    // ── Card Rendering ────────────────────────────────────────

    _renderHand() {
        // Bersihkan kartu lama
        this.cardObjects.forEach(obj => obj.forEach(o => o.destroy()));
        this.cardObjects = [];

        const hand  = this.player.hand;
        const count = hand.length;
        if (count === 0) return;

        const cardW   = 90;
        const cardH   = 120;
        const spacing = 100;
        const startX  = GAME_WIDTH / 2 - ((count - 1) * spacing) / 2;
        const baseY   = GAME_HEIGHT - 75;

        hand.forEach((card, i) => {
            const x = startX + i * spacing;
            const cardObjs = this._createCardObject(card, x, baseY, i);
            this.cardObjects.push(cardObjs);
        });
    }

    _createCardObject(card, x, y, handIndex) {
        const w = 90, h = 120;

        // Background kartu
        const bg = this.add.image(x, y, card.spriteKey || 'card_attack')
            .setDisplaySize(w, h)
            .setInteractive({ useHandCursor: true });

        // Cost
        const costTxt = this.add.text(x - w / 2 + 10, y - h / 2 + 8, `${card.cost}`, {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffcc44',
        }).setOrigin(0);

        // Nama kartu
        const nameTxt = this.add.text(x, y + 22, card.name, {
            fontFamily: 'monospace', fontSize: '9px', color: '#ffffff',
            wordWrap:   { width: w - 8 },
            align:      'center',
        }).setOrigin(0.5, 0);

        // Greyed out kalau tidak cukup energi
        if (card.cost > this.player.energy) {
            bg.setTint(0x444444);
            nameTxt.setColor('#666666');
        }

        // Hover: naik sedikit
        bg.on('pointerover', () => {
            if (card.cost <= this.player.energy) {
                bg.y = y - 20;
                costTxt.y = y - h / 2 + 8 - 20;
                nameTxt.y = y + 22 - 20;
            }
        });

        bg.on('pointerout', () => {
            bg.y = y;
            costTxt.y = y - h / 2 + 8;
            nameTxt.y = y + 22;
        });

        // Klik: mainkan kartu
        bg.on('pointerdown', () => {
            if (this.combat.state !== COMBAT_STATE.PLAYER_TURN) return;
            if (card.cost > this.player.energy) return;

            const result = this.combat.playCard(handIndex, 0);
            if (result.success) {
                this._handleCombatEvents(result.events);
                this._refreshUI();
                this._renderHand();

                if (this.combat.isOver) {
                    this._handleCombatEnd();
                }
            }
        });

        return [bg, costTxt, nameTxt];
    }

    // ── UI Refresh ────────────────────────────────────────────

    _refreshUI() {
        const p = this.player;

        // Player HP bar
        const hpPct = p.hp / p.stats[STAT.HP_MAX];
        this.playerHpBar.setScale(hpPct, 1);
        this.playerHpText.setText(`${p.hp} / ${p.stats[STAT.HP_MAX]}`);

        // Block
        this.playerBlockText.setText(p.block > 0 ? `🛡 ${p.block}` : '');

        // Energy
        this.energyText.setText(`⚡ ${p.energy} / ${ENERGY_PER_TURN}`);

        // Status
        const statuses = (p.statusEffects || []).map(s => `${s.type}(${s.value})`).join(' ');
        this.playerStatusText.setText(statuses);

        // Deck / Discard
        this.deckText.setText(`📚 ${p.deck.length}`);
        this.discardText.setText(`🗑 ${p.discard.length}`);

        // Turn
        this.turnText.setText(
            this.combat.state === COMBAT_STATE.PLAYER_TURN
                ? `Giliran Player — Turn ${this.combat.turn}`
                : 'Giliran Musuh...'
        );

        // Monster bars & intent
        this.monsters.forEach((monster, i) => {
            const hpPct = monster.hp / monster.maxHP;
            this.monsterHpBars[i].setScale(hpPct, 1);
            this.monsterHpTexts[i].setText(`${monster.hp}/${monster.maxHP}`);

            // Intent icon
            const intent = monster.currentIntent?.intent || '';
            const icons  = {
                attack:        '⚔️',
                attack_strong: '💥',
                defend:        '🛡️',
                buff:          '✨',
                stunned:       '💫',
            };
            this.monsterIntentIcons[i].setText(icons[intent] || '❓');
        });
    }

    // ── Event Handling ────────────────────────────────────────

    _handleCombatEvents(events) {
        // Phase 1: cukup log ke console, nanti diganti animasi
        for (const evt of events) {
            console.log('[Combat Event]', evt);
        }
    }

    // ── End Turn ──────────────────────────────────────────────

    _doEndTurn() {
        const events = this.combat.endPlayerTurn();
        this._handleCombatEvents(events);
        this._refreshUI();
        this._renderHand();

        if (this.combat.isOver) {
            this._handleCombatEnd();
        }
    }

    // ── Combat End ────────────────────────────────────────────

    _handleCombatEnd() {
        if (this.combat.playerWon) {
            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '✦ MENANG ✦', {
                fontFamily: 'monospace', fontSize: '36px', color: '#ffcc44',
            }).setOrigin(0.5);

            this.time.delayedCall(1000, () => {
                // Kalau ada mapData, pergi ke RewardScene
                // Kalau tidak (direct play), balik ke MainMenu
                if (this.mapData) {
                    this.scene.start(SCENE.REWARD, {
                        zone:          this.zone,
                        floor:         this.floor,
                        curseLevel:    this.curseLevel,
                        playerData:    this.player.toJSON(),
                        mapData:       this.mapData,
                        currentNodeId: this.currentNodeId,
                    });
                } else {
                    this.scene.start(SCENE.MAIN_MENU);
                }
            });

        } else {
            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '✦ GAME OVER ✦', {
                fontFamily: 'monospace', fontSize: '36px', color: '#cc3333',
            }).setOrigin(0.5);

            this.time.delayedCall(1500, () => {
                this.scene.start(SCENE.GAME_OVER, { floor: this.floor });
            });
        }
    }
}