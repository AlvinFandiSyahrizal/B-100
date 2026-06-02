
import {
    SCENE,
    GAME_WIDTH,
    GAME_HEIGHT,
    MAX_CURSE_LEVEL,
    MIN_CURSE_LEVEL,
    CURSE_STAT_MULTIPLIER,
    CURSE_REWARD_MULTIPLIER
} from '../config/constants.js';

import { SaveSystem } from '../storage/SaveSystem.js';
import { GameGuard } from '../utils/GameGuard.js';
import { Player } from '../entities/Player.js';
import { DeckSystem }   from '../systems/DeckSystem.js';
import { STARTER_DECK } from '../data/cards/index.js';

const CURSE_INFO = [
    null,
    {
        name: 'Bisikan Yokai',
        desc: 'Aura dungeon masih tenang. Roh-roh belum sepenuhnya terbangun.',
        flavor: '"Langkah awal menentukan nasibmu."',
        color: '#54d46d',
    },
    {
        name: 'Kutukan Senja',
        desc: 'Energi yokai mulai memenuhi lorong gelap.',
        flavor: '"Mereka mulai memperhatikanmu."',
        color: '#c3d54d',
    },
    {
        name: 'Tarian Arwah',
        desc: 'Yokai bergerak cepat. Reward meningkat.',
        flavor: '"Bayangan mulai bergerak sendiri."',
        color: '#f0b04d',
    },
    {
        name: 'Gerbang Neraka',
        desc: 'Kutukan semakin dalam. Semua jadi lebih brutal.',
        flavor: '"Jangan lihat ke belakang."',
        color: '#f06c4d',
    },
    {
        name: 'Kiamat Yokai',
        desc: 'Dungeon sepenuhnya hidup.',
        flavor: '"Yang masuk tidak pernah sama saat keluar."',
        color: '#ff4444',
    },
];

export class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENE.CHAR_SEL });
    }

    init() {
        this.curseLevel = 1;
        this.playerName = '';
        this.nameEditing = false;
        this.placeholder = 'Masukkan nama ronin...';

        this._startingRun = false;
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

    _buildBackground() {
        // Base dark
        this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x06070d
        );

            this.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 90,
        GAME_WIDTH,
        160,
        0x090b14,
        0.95
    );

    this.add.text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 130,
        '⛩',
        {
            fontSize: '120px',
            color: '#28160d',
        }
    ).setOrigin(0.5).setAlpha(0.18);

    const grid = this.add.graphics();

    grid.lineStyle(1, 0x141a28, 0.35);

    for (let y = 0; y < GAME_HEIGHT; y += 42) {
        grid.moveTo(0, y);
        grid.lineTo(GAME_WIDTH, y);
    }

    for (let x = 0; x < GAME_WIDTH; x += 90) {
        grid.moveTo(x, 0);
        grid.lineTo(x, GAME_HEIGHT);
    }

    grid.strokePath();

    const glow = this.add.graphics();

    glow.fillStyle(0x2b1530, 0.18);
    glow.fillCircle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        240
    );

    glow.fillStyle(0x8b3e1d, 0.08);
    glow.fillCircle(
        GAME_WIDTH / 2,
        160,
        140
    );

    const fog1 = this.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 35,
        GAME_WIDTH,
        90,
        0x241633,
        0.18
    );

    const fog2 = this.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 20,
        GAME_WIDTH,
        70,
        0x111827,
        0.15
    );

    this.tweens.add({
        targets: fog1,
        alpha: 0.28,
        duration: 2500,
        yoyo: true,
        repeat: -1,
    });

    this.tweens.add({
        targets: fog2,
        alpha: 0.24,
        duration: 3200,
        yoyo: true,
        repeat: -1,
    });


    for (let i = 0; i < 7; i++) {
        const x =
            Phaser.Math.Between(
                280,
                GAME_WIDTH - 280
            );

        const y =
            Phaser.Math.Between(
                120,
                GAME_HEIGHT - 180
            );

        const orb =
            this.add.circle(
                x,
                y,
                Phaser.Math.Between(2, 4),
                Phaser.Utils.Array.GetRandom([
                    0x8b5cf6,
                    0x60a5fa,
                    0xf59e0b,
                ]),
                0.22
            );

        this.tweens.add({
            targets: orb,

            y: y - Phaser.Math.Between(
                10,
                30
            ),

            alpha: {
                from: 0.25,
                to: 0,
            },

            duration:
                Phaser.Math.Between(
                    2500,
                    4500
                ),

            repeat: -1,

            delay:
                Phaser.Math.Between(
                    0,
                    2500
                ),
        });
    }

        this.tweens.add({
            targets: glow,
            alpha: 0.75,
            duration: 2800,
            yoyo: true,
            repeat: -1,
        });
    }

    _buildTitle() {
        this.add.text(
            GAME_WIDTH / 2 - 170,
            108,
            '⛩',
            {
                fontSize: '24px',
                color: '#d97a2b',
            }
        ).setOrigin(0.5);

        this.add.text(
            GAME_WIDTH / 2 + 170,
            108,
            '⛩',
            {
                fontSize: '24px',
                color: '#d97a2b',
            }
        ).setOrigin(0.5);

        const title =
            this.add.text(
                GAME_WIDTH / 2,
                108,
                'Gerbang Yokai',
                {
                    fontFamily: 'monospace',
                    fontSize: '34px',
                    color: '#f7b24a',
                    fontStyle: 'bold',
                }
            ).setOrigin(0.5);

        this.tweens.add({
            targets: title,
            alpha: 0.82,
            duration: 1600,
            yoyo: true,
            repeat: -1,
        });

        this.add.text(
            GAME_WIDTH / 2,
            70,
            'DUNGEON B100',
            {
                fontSize: '12px',
                color: '#88612e',
                letterSpacing: 5,
            }
        ).setOrigin(0.5);

        this.add.text(
            GAME_WIDTH / 2,
            145,
            'Tentukan nama dan hadapi seratus lantai kutukan.',
            {
                fontSize: '12px',
                color: '#8d97aa',
            }
        ).setOrigin(0.5);
    }

    _buildNameInput() {
        const glow = this.add.rectangle(
            GAME_WIDTH / 2,
            225,
            372,
            58,
            0xf5b34d,
            0
        );

        const box = this.add.rectangle(
            GAME_WIDTH / 2,
            225,
            360,
            48,
            0x0f1322
        )
            .setStrokeStyle(2, 0x293244)
            .setInteractive({
                useHandCursor: true
            });

        this.nameTxt = this.add.text(
            GAME_WIDTH / 2 - 150,
            225,
            this.placeholder,
            {
                fontFamily: 'monospace',
                fontSize: '18px',
                color: '#6f7c94',
            }
        ).setOrigin(0, 0.5);

        this.cursor = this.add.text(
            GAME_WIDTH / 2 - 150,
            225,
            '',
            {
                fontFamily: 'monospace',
                fontSize: '18px',
                color: '#f5b34d',
            }
        ).setOrigin(0, 0.5);

        box.on('pointerdown', () => {
            this.nameEditing = true;

            if (!this.playerName) {
                this.nameTxt.setText('');
            }

            box.setStrokeStyle(2, 0xf5b34d);

            glow.setAlpha(0.10);

            this.tweens.add({
                targets: glow,
                alpha: 0.18,
                duration: 600,
                yoyo: true,
                repeat: -1,
            });

            this._startCursorBlink();
        });

        this.input.keyboard.on('keydown', (e) => {
            if (!this.nameEditing) return;

            if (
                e.key === 'Enter' ||
                e.key === 'Escape'
            ) {
                this.nameEditing = false;

                box.setStrokeStyle(
                    2,
                    0x293244
                );

                this.cursor.setText('');

                if (!this.playerName) {
                    this.nameTxt
                        .setText(this.placeholder)
                        .setColor('#6f7c94');
                }

                return;
            }

            if (e.key === 'Backspace') {
                this.playerName =
                    this.playerName.slice(0, -1);
            }
            else if (
                e.key.length === 1 &&
                this.playerName.length < 16
            ) {
                this.playerName += e.key;
            }

            this.nameTxt
                .setText(this.playerName || '')
                .setColor('#ffffff');

            this.cursor.setX(
                this.nameTxt.x +
                this.nameTxt.width +
                4
            );
        });
    }

    _startCursorBlink() {
        if (this._cursorTween) {
            this._cursorTween.stop();
        }

        this._cursorTween =
            this.tweens.add({
                targets: this.cursor,
                alpha: 0,
                duration: 500,
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (this.nameEditing) {
                        this.cursor.setText('|');
                    }
                },
            });
    }

    _buildCurseLevelSelector() {
    const y = 320;

    this.curseCards = [];

    const startX =
        GAME_WIDTH / 2 - 220;

    for (
        let level = 1;
        level <= MAX_CURSE_LEVEL;
        level++
    ) {
        const info =
            CURSE_INFO[level];

        const x =
            startX +
            (level - 1) * 110;

        const glow =
            this.add.rectangle(
                x,
                y,
                88,
                76,
                Phaser.Display
                    .Color
                    .HexStringToColor(
                        info.color
                    ).color,
                0
            );

        const card =
            this.add.rectangle(
                x,
                y,
                84,
                72,
                0x111827
            )
            .setStrokeStyle(
                2,
                0x293244
            )
            .setInteractive({
                useHandCursor: true
            });

        const roman =
            ['I','II','III','IV','V'][level - 1];

        const levelTxt =
            this.add.text(
                x,
                y - 12,
                roman,
                {
                    fontFamily:
                        'monospace',
                    fontSize: '18px',
                    color: '#ffffff',
                    fontStyle:
                        'bold',
                }
            ).setOrigin(0.5);

        const nameTxt =
            this.add.text(
                x,
                y + 14,
                info.name,
                {
                    fontSize: '9px',
                    color: '#7d8aa3',
                    align: 'center',
                    wordWrap: {
                        width: 78
                    }
                }
            ).setOrigin(0.5);

            const statTxt =
                this.add.text(
                    x,
                    y + 28,
                    '',
                    {
                        fontSize: '8px',
                        color: '#9ca3af',
                        align: 'center'
                    }
                )
                .setOrigin(0.5);

        card.on(
            'pointerover',
            () => {
                if (
                    this.curseLevel !==
                    level
                ) {
                    card.setScale(
                        1.04
                    );
                }
            }
        );

        card.on(
            'pointerout',
            () => {
                if (
                    this.curseLevel !==
                    level
                ) {
                    card.setScale(1);
                }
            }
        );

        card.on(
            'pointerdown',
            () => {
                this.curseLevel =
                    level;

                this._updateCurseDisplay();
            }
        );

        this.curseCards.push({
            level,
            glow,
            card,
            levelTxt,
            nameTxt,
            statTxt,
        });
    }

    this._updateCurseDisplay();
}

    _buildCurseInfo() {
        this.cursePanelBg =
            this.add.rectangle(
                GAME_WIDTH / 2,
                470,
                640,
                150,
                0x101425
            )
                .setStrokeStyle(2, 0x22293b);

        this.curseDescTxt =
            this.add.text(
                GAME_WIDTH / 2,
                445,
                '',
                {
                    fontSize: '13px',
                    color: '#d6dde8',
                    align: 'center',
                    wordWrap: { width: 580 },
                }
            ).setOrigin(0.5);

        this.curseFlavorTxt =
            this.add.text(
                GAME_WIDTH / 2,
                478,
                '',
                {
                    fontSize: '11px',
                    color: '#8f9db4',
                    fontStyle: 'italic',
                }
            ).setOrigin(0.5);

        this.curseStatTxt =
            this.add.text(
                GAME_WIDTH / 2,
                510,
                '',
                {
                    fontSize: '11px',
                    color: '#7d8aa3',
                }
            ).setOrigin(0.5);

        this._updateCurseInfo();
    }

    _buildStartButton() {
        const glow =
            this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT - 110,
                320,
                66,
                0xf08c42,
                0.08
            );

        const bg =
            this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT - 110,
                300,
                56,
                0x2c120a
            )
            .setStrokeStyle(
                2,
                0xf08c42
            )
            .setInteractive();

        const txt =
            this.add.text(
                GAME_WIDTH / 2,
                GAME_HEIGHT - 110,
                '⚔ Masuki Dungeon',
                {
                    fontSize: '18px',
                    color: '#ffb067',
                    fontStyle: 'bold',
                }
            )
            .setOrigin(0.5);

        this.tweens.add({
            targets: glow,
            alpha: 0.18,
            scaleX: 1.05,
            scaleY: 1.08,
            duration: 1300,
            yoyo: true,
            repeat: -1,
        });

        bg.on('pointerover', () => {
            bg.setScale(1.03);
            bg.setFillStyle(0x44200d);
            txt.setColor('#ffd59a');
        });

        bg.on('pointerout', () => {
            bg.setScale(1);
            bg.setFillStyle(0x2c120a);
            txt.setColor('#ffb067');
        });

        bg.on('pointerdown', () => {

            this.cameras.main.shake(
                120,
                0.002
            );

            this.tweens.add({
                targets: bg,
                scale: 0.96,
                duration: 80,
                yoyo: true
            });

            this._startRun();
        });
    }

    _buildBackButton() {
        this.add.text(
            80,
            GAME_HEIGHT - 50,
            '← Kembali',
            {
                fontSize: '12px',
                color: '#76839b',
            }
        )
            .setOrigin(0.5)
            .setInteractive()
            .on(
                'pointerdown',
                () => this.scene.start(
                    SCENE.MAIN_MENU
                )
            );
    }

    _updateCurseDisplay() {
        const info =
            CURSE_INFO[
                this.curseLevel
            ];

        this.curseCards.forEach(
            (item) => {
                const active =
                    item.level ===
                    this.curseLevel;

                const stat =
                    CURSE_STAT_MULTIPLIER[
                        item.level
                    ];
                
                item.statTxt.setText(
                    `Enemy ×${stat.toFixed(1)}`
                );

                const color =
                    Phaser.Display
                        .Color
                        .HexStringToColor(
                            CURSE_INFO[
                                item.level
                            ].color
                        ).color;

                item.card
                    .setStrokeStyle(
                        active ? 2 : 1,
                        active
                            ? color
                            : 0x293244
                    )
                    .setScale(
                        active
                            ? 1.05
                            : 1
                    );

                item.glow.setAlpha(
                    active
                        ? 0.12
                        : 0
                );

                item.nameTxt.setColor(
                    active
                        ? CURSE_INFO[
                            item.level
                        ].color
                        : '#7d8aa3'
                );
            }
        );

        this._updateCurseInfo();
    }

    _updateCurseInfo() {
        const info =
            CURSE_INFO[this.curseLevel];

        const stat =
            CURSE_STAT_MULTIPLIER[
                this.curseLevel
            ];

        const reward =
            CURSE_REWARD_MULTIPLIER[
                this.curseLevel
            ];

        this.curseDescTxt.setText(
            info.desc
        );

        this.curseFlavorTxt.setText(
            info.flavor
        );

        this.curseStatTxt.setText(
            `Musuh ×${stat.toFixed(1)}   •   Reward ×${reward.toFixed(1)}`
                );
                this.cursePanelBg.setStrokeStyle(
            2,
            Phaser.Display.Color.HexStringToColor(
                info.color
            ).color
        );
    }

    _showNameWarning(msg) {
    if (this.warningTxt) {
        this.warningTxt.destroy();
    }

        this.warningTxt =
            this.add.text(
                GAME_WIDTH / 2,
                270,
                msg,
                {
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#ff6b6b',
                    fontStyle: 'bold',
                }
            )
            .setOrigin(0.5);

        this.tweens.add({
            targets: this.warningTxt,
            alpha: 0,
            duration: 1200,
            delay: 1000,
            onComplete: () => {
                this.warningTxt?.destroy();
                this.warningTxt = null;
            }
        });
    }

    _startRun() {
        const name =
            this.playerName.trim();
        if (!name) {
            this._showNameWarning(
                'Nama ronin belum diisi.'
            );
            return;
        }

        if (this._startingRun) {
            return;
        }

        const portal =
            this.add.circle(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2,
                20,
                0xf59e0b,
                0.08
            )
            .setDepth(998);

        this.tweens.add({
            targets: portal,
            scale: 30,
            alpha: 0,
            duration: 900,
        });

        this._startingRun = true;

        SaveSystem.clearRun();
        GameGuard.activate();

        const overlay =
            this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2,
                GAME_WIDTH,
                GAME_HEIGHT,
                0x000000,
                0
            )
            .setDepth(999);

        const floorTxt =
            this.add.text(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 - 18,
                'LANTAI 1',
                {
                    fontFamily: 'monospace',
                    fontSize: '34px',
                    color: '#f5b34d',
                    fontStyle: 'bold',
                }
            )
            .setOrigin(0.5)
            .setDepth(1000)
            .setAlpha(0);

        const subTxt =
            this.add.text(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 + 20,
                'DUNGEON B100',
                {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: '#d8e2ff',
                }
            )
            .setOrigin(0.5)
            .setDepth(1000)
            .setAlpha(0);

        this.tweens.add({
            targets: overlay,
            alpha: 0.85,
            duration: 450,
        });

        this.tweens.add({
            targets: [
                floorTxt,
                subTxt
            ],
            alpha: 1,
            duration: 300,
            delay: 250,
        });

        this.time.delayedCall(1500, () => {
                this._startingRun = false;
        
                const player = new Player({
                    name,
                    curseLevel: this.curseLevel,
                });

            console.log(
                '[NEW RUN PLAYER]',
                player
            );

        this.scene.start(SCENE.NODE_MAP, {
            zone:       1,
            floor:      1,
            curseLevel: this.curseLevel,
            playerName: name,
            playerData: player.toJSON(), 
            mapData:    null,
        });
    });
       
    }
}