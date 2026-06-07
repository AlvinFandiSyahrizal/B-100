// ============================================================
// gameConfig.js — konfigurasi Phaser engine
// Update Phase 4: tambah GashaponScene
// ============================================================
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { BootScene }            from '../scenes/BootScene.js';
import { PreloadScene }         from '../scenes/PreloadScene.js';
import { MainMenuScene }        from '../scenes/MainMenuScene.js';
import { CombatScene }          from '../scenes/CombatScene.js';
import { GameOverScene }        from '../scenes/GameOverScene.js';
import { NodeMapScene }         from '../scenes/NodeMapScene.js';
import { RewardScene }          from '../scenes/RewardScene.js';
import { ShopScene }            from '../scenes/ShopScene.js';
import { RestScene }            from '../scenes/RestScene.js';
import { BossIntroScene }       from '../scenes/BossIntroScene.js';
import { VictoryScene }         from '../scenes/VictoryScene.js';
import { EventScene }           from '../scenes/EventScene.js';
import { ShrineScene }          from '../scenes/ShrineScene.js';
import { CharacterSelectScene } from '../scenes/CharacterSelectScene.js';
import { GashaponScene }        from '../scenes/GashaponScene.js';  

export const gameConfig = {
    type:            Phaser.AUTO,
    width:           GAME_WIDTH,
    height:          GAME_HEIGHT,
    parent:          'game-container',
    backgroundColor: '#0a0a0f',
    scale: {
        mode:       Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade:  { debug: false },
    },
    scene: [
        BootScene,
        PreloadScene,
        MainMenuScene,
        NodeMapScene,
        CombatScene,
        RewardScene,
        ShopScene,
        RestScene,
        BossIntroScene,
        VictoryScene,
        GameOverScene,
        EventScene,
        ShrineScene,
        CharacterSelectScene,
        GashaponScene,         
    ],
};