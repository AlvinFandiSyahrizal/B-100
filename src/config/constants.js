export const GAME_WIDTH  = 1280;
export const GAME_HEIGHT = 720;
// ── Dungeon ──────────────────────────────────────────────────
export const MAX_FLOOR        = 100;  
export const FLOORS_PER_ZONE  = 10;   
export const BOSS_EVERY       = 10;   
export const TOTAL_ZONES      = 10;
// ── Combat ───────────────────────────────────────────────────
export const ENERGY_PER_TURN  = 4;    
export const HAND_SIZE        = 5;    
export const MIN_DECK_SIZE    = 10;   
export const MAX_DECK_SIZE    = 30;   
export const IDEAL_DECK_SIZE  = 20;   
// ── Party ────────────────────────────────────────────────────
export const MAX_PARTY_SIZE   = 3;    
export const MAX_COMPANIONS   = 2;
// ── Rarity ───────────────────────────────────────────────────
export const RARITY = {
    COMMON:    'common',
    UNCOMMON:  'uncommon',
    RARE:      'rare',
    EPIC:      'epic',
    LEGENDARY: 'legendary',
};
// Warna rarity untuk UI
export const RARITY_COLOR = {
    common:    0x9e9e9e,  
    uncommon:  0x4caf50,  
    rare:      0x2196f3,  
    epic:      0x9c27b0,  
    legendary: 0xff9800,  
};
// Chance drop rarity per zona (index 0 = zona 1, dst)
// Format: [common, uncommon, rare, epic, legendary] dalam persen
export const RARITY_WEIGHTS_BY_ZONE = [
    [60, 30, 9,  1,  0 ],  
    [55, 30, 12, 3,  0 ],  
    [45, 30, 18, 6,  1 ],  
    [40, 30, 20, 8,  2 ],  
    [35, 28, 22, 12, 3 ],  
    [30, 25, 25, 15, 5 ],  
    [25, 22, 28, 18, 7 ],  
    [20, 20, 28, 22, 10],  
    [15, 18, 27, 25, 15],  
    [10, 15, 25, 28, 22],  
];
// ── Status Effects ────────────────────────────────────────────
export const STATUS = {
    BURN:       'burn',
    POISON:     'poison',
    BLEED:      'bleed',
    STUN:       'stun',
    FREEZE:     'freeze',
    CHILL:      'chill',
    WET:        'wet',
    CONFUSE:    'confuse',
    SHIELD:     'shield',
    DODGE:      'dodge',
    HASTE:      'haste',
    FOCUS:      'focus',
    FORTIFY:    'fortify',
    ECHO:       'echo',
    CURSE:      'curse',
    STANCE:     'stance',
    TAIKO:      'taiko',
};
// ── Node Types (peta bercabang) ───────────────────────────────
export const NODE_TYPE = {
    COMBAT:   'combat',
    ELITE:    'elite',
    SHOP:     'shop',
    REST:     'rest',
    EVENT:    'event',
    TREASURE: 'treasure',
    SHRINE:   'shrine',
    BOSS:     'boss',
    START:    'start',
};
// Bobot kemunculan node per zona (bisa disesuaikan)
export const NODE_WEIGHTS = {
    combat:   35,
    elite:    15,
    shop:     12,
    rest:     10,
    event:    15,
    treasure: 8,
    shrine:   5,
};
// Boss selalu di ujung, tidak masuk pool acak
// ── Equipment Slots ───────────────────────────────────────────
export const EQUIP_SLOT = {
    WEAPON:    'weapon',
    KABUTO:    'kabuto',    
    DO:        'do',        
    KOTE:      'kote',      
    SUNEATE:   'suneate',   
    ACCESSORY: 'accessory',
};
// ── Companion Modes ───────────────────────────────────────────
export const COMPANION_MODE = {
    AGGRESSIVE: 'aggressive',
    DEFENSIVE:  'defensive',
    SUPPORT:    'support',
};
// ── Stat Keys ────────────────────────────────────────────────
export const STAT = {
    // primer
    STR: 'str',
    INT: 'int',
    AGI: 'agi',
    // sekunder
    HP:       'hp',
    HP_MAX:   'hp_max',
    MP:       'mp',
    MP_MAX:   'mp_max',
    DEF:      'def',
    MDEF:     'mdef',
    HIT:      'hit',
    DODGE:    'dodge',
    CRIT:     'crit',
    CRIT_DMG: 'crit_dmg',
};
export const STANCE = {
    NONE:    'none',
    ATTACK:  'attack',   
    DEFEND:  'defend',   
    FLOW:    'flow',     
};
// Card rarity (untuk kartu baru)
export const CARD_RARITY = {
    COMMON:    'common',
    UNCOMMON:  'uncommon',
    RARE:      'rare',
    EPIC:      'epic',
    LEGENDARY: 'legendary',
};
// ── Card Types ────────────────────────────────────────────────
export const CARD_TYPE = {
    ATTACK:  'attack',
    DEFENSE: 'defense',
    MAGIC:   'magic',
    SUPPORT: 'support',
    SPECIAL: 'special',
};
// ── Damage Types ──────────────────────────────────────────────
export const DMG_TYPE = {
    PHYSICAL: 'physical',
    MAGIC:    'magic',
    TRUE:     'true',     
};
// ── Curse Levels (difficulty) ─────────────────────────────────
export const MIN_CURSE_LEVEL = 1;
export const MAX_CURSE_LEVEL = 5;
// Multiplier stat musuh per curse level
export const CURSE_STAT_MULTIPLIER = {
    1: 1.0,
    2: 1.15,
    3: 1.35,
    4: 1.6,
    5: 2.0,
};
// Multiplier reward per curse level
export const CURSE_REWARD_MULTIPLIER = {
    1: 1.0,
    2: 1.2,
    3: 1.5,
    4: 1.8,
    5: 2.5,
};
// ── Scaling ───────────────────────────────────────────────────
// Setiap lantai, stat musuh naik sekian persen dari base
export const MONSTER_SCALE_PER_FLOOR = 0.08;  
export const BOSS_STAT_MULTIPLIER    = 2.5;   
export const ELITE_STAT_MULTIPLIER   = 1.5;   
// ── Gold ─────────────────────────────────────────────────────
export const GOLD_BASE_COMBAT   = 15;   
export const GOLD_BASE_ELITE    = 35;   
export const GOLD_BASE_BOSS     = 100;  
// ── UI / Scene Keys ───────────────────────────────────────────
// Dipakai untuk Phaser scene.start('key')
export const SCENE = {
    BOOT:      'BootScene',
    PRELOAD:   'PreloadScene',
    MAIN_MENU: 'MainMenuScene',
    CHAR_SEL:  'CharacterSelectScene',
    NODE_MAP:  'NodeMapScene',
    COMBAT:    'CombatScene',
    EVENT:     'EventScene',
    SHOP:      'ShopScene',
    REST:      'RestScene',
    BOSS_INTRO:'BossIntroScene',
    REWARD:    'RewardScene',
    GAME_OVER: 'GameOverScene',
    VICTORY:   'VictoryScene',
    SHRINE:    'ShrineScene',
    GASHAPON:  'GashaponScene',   
};