// ============================================================
// constants.js — angka-angka tetap yang dipakai di seluruh game
// Kalau mau ubah balance, ubah di sini saja
// ============================================================

export const GAME_WIDTH  = 1280;
export const GAME_HEIGHT = 720;

// ── Dungeon ──────────────────────────────────────────────────
export const MAX_FLOOR        = 100;  // lantai terakhir
export const FLOORS_PER_ZONE  = 10;   // B1-B10 = zona 1, dst
export const BOSS_EVERY       = 10;   // boss di B10, B20, ...
export const TOTAL_ZONES      = 10;

// ── Combat ───────────────────────────────────────────────────
export const ENERGY_PER_TURN  = 3;    // energi yang didapat tiap giliran
export const HAND_SIZE        = 4;    // kartu yang ditarik tiap giliran
export const MIN_DECK_SIZE    = 10;   // deck minimal awal run
export const MAX_DECK_SIZE    = 30;   // deck tidak boleh lebih dari ini
export const IDEAL_DECK_SIZE  = 20;   // referensi ideal

// ── Party ────────────────────────────────────────────────────
export const MAX_PARTY_SIZE   = 3;    // 1 MC + 2 companion
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
    common:    0x9e9e9e,  // abu-abu
    uncommon:  0x4caf50,  // hijau
    rare:      0x2196f3,  // biru
    epic:      0x9c27b0,  // ungu
    legendary: 0xff9800,  // oranye
};

// Chance drop rarity per zona (index 0 = zona 1, dst)
// Format: [common, uncommon, rare, epic, legendary] dalam persen
export const RARITY_WEIGHTS_BY_ZONE = [
    [60, 30, 9,  1,  0 ],  // zona 1
    [55, 30, 12, 3,  0 ],  // zona 2
    [45, 30, 18, 6,  1 ],  // zona 3
    [40, 30, 20, 8,  2 ],  // zona 4
    [35, 28, 22, 12, 3 ],  // zona 5
    [30, 25, 25, 15, 5 ],  // zona 6
    [25, 22, 28, 18, 7 ],  // zona 7
    [20, 20, 28, 22, 10],  // zona 8
    [15, 18, 27, 25, 15],  // zona 9
    [10, 15, 25, 28, 22],  // zona 10
];

// ── Status Effects ────────────────────────────────────────────
export const STATUS = {
    BURN:    'burn',
    POISON:  'poison',
    BLEED:   'bleed',
    STUN:    'stun',
    FREEZE:  'freeze',
    SHIELD:  'shield',
    DODGE:   'dodge',
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
    shop:     15,
    rest:     10,
    event:    15,
    treasure: 10,
};
// Boss selalu di ujung, tidak masuk pool acak

// ── Equipment Slots ───────────────────────────────────────────
export const EQUIP_SLOT = {
    WEAPON:    'weapon',
    KABUTO:    'kabuto',    // helm
    DO:        'do',        // baju besi
    KOTE:      'kote',      // sarung tangan
    SUNEATE:   'suneate',   // pelindung kaki
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
    TRUE:     'true',     // true damage, tidak kena reduksi apapun
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
export const MONSTER_SCALE_PER_FLOOR = 0.08;  // 8% per lantai
export const BOSS_STAT_MULTIPLIER    = 2.5;   // boss jauh lebih kuat dari musuh biasa
export const ELITE_STAT_MULTIPLIER   = 1.5;   // elite lebih kuat dari musuh biasa

// ── Gold ─────────────────────────────────────────────────────
export const GOLD_BASE_COMBAT   = 15;   // gold dari combat biasa
export const GOLD_BASE_ELITE    = 35;   // gold dari elite
export const GOLD_BASE_BOSS     = 100;  // gold dari boss

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
    META:      'MetaScene',
    NODE_MAP: 'NodeMapScene',
};
