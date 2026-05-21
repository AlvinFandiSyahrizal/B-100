// ============================================================
// DamageNumber.js — angka damage melayang di atas target
// Dipanggil dari CombatScene setiap kali ada damage/heal/block
// ============================================================

export class DamageNumber {

    /**
     * Tampilkan angka damage melayang.
     * @param {Phaser.Scene} scene
     * @param {number}       x, y     - posisi awal
     * @param {number}       amount   - jumlah damage
     * @param {string}       type     - 'physical'|'magic'|'heal'|'block'|'poison'|'burn'|'miss'
     */
    static show(scene, x, y, amount, type = 'physical') {
        const config = this._getConfig(type, amount);

        const txt = scene.add.text(
            x + Phaser.Math.Between(-20, 20),
            y,
            config.text,
            {
                fontFamily:       'monospace',
                fontSize:         config.size,
                color:            config.color,
                fontStyle:        'bold',
                stroke:           '#000000',
                strokeThickness:  3,
            }
        ).setOrigin(0.5).setDepth(60);

        // Animasi: melayang ke atas lalu fade
        scene.tweens.add({
            targets:  txt,
            y:        y - 80,
            alpha:    { from: 1, to: 0 },
            scaleX:   { from: 1, to: config.endScale },
            scaleY:   { from: 1, to: config.endScale },
            duration: config.duration,
            ease:     'Power2',
            onComplete: () => { try { txt.destroy(); } catch(e){} },
        });
    }

    /**
     * Tampilkan teks status effect.
     */
    static showStatus(scene, x, y, statusType, value) {
        const configs = {
            burn:    { text: `🔥 ${value}`, color: '#ff6633' },
            poison:  { text: `☠ ${value}`,  color: '#44cc44' },
            bleed:   { text: `🩸 ${value}`,  color: '#cc2222' },
            freeze:  { text: `❄ FREEZE`,     color: '#88ddff' },
            stun:    { text: `⚡ STUN`,       color: '#ffcc00' },
            chill:   { text: `❄ CHILL`,      color: '#aaddff' },
            wet:     { text: `💧 WET`,        color: '#4488ff' },
        };
        const cfg = configs[statusType] || { text: statusType, color: '#ffffff' };

        DamageNumber.show(scene, x, y, 0, 'status');

        const txt = scene.add.text(x + Phaser.Math.Between(-15, 15), y - 20, cfg.text, {
            fontFamily: 'monospace', fontSize: '14px',
            color: cfg.color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(60);

        scene.tweens.add({
            targets:  txt,
            y:        y - 90,
            alpha:    { from: 1, to: 0 },
            duration: 1200,
            ease:     'Power2',
            onComplete: () => { try { txt.destroy(); } catch(e){} },
        });
    }

    static _getConfig(type, amount) {
        switch (type) {
            case 'physical':
                return {
                    text:     `-${amount}`,
                    color:    '#ff4444',
                    size:     amount >= 20 ? '26px' : '22px',
                    duration: 900,
                    endScale: 0.8,
                };
            case 'magic':
                return {
                    text:     `-${amount}`,
                    color:    '#cc66ff',
                    size:     amount >= 20 ? '26px' : '22px',
                    duration: 900,
                    endScale: 0.8,
                };
            case 'true':
                return {
                    text:     `-${amount}`,
                    color:    '#ffffff',
                    size:     '20px',
                    duration: 800,
                    endScale: 0.7,
                };
            case 'heal':
                return {
                    text:     `+${amount}`,
                    color:    '#44ff88',
                    size:     '22px',
                    duration: 1000,
                    endScale: 1.1,
                };
            case 'block':
                return {
                    text:     `🛡 ${amount}`,
                    color:    '#4488ff',
                    size:     '20px',
                    duration: 800,
                    endScale: 0.9,
                };
            case 'miss':
                return {
                    text:     'DODGE!',
                    color:    '#ffcc00',
                    size:     '20px',
                    duration: 1000,
                    endScale: 1.2,
                };
            case 'execute':
                return {
                    text:     '💀 EKSEKUSI!',
                    color:    '#ff0000',
                    size:     '24px',
                    duration: 1200,
                    endScale: 1.3,
                };
            case 'echo':
                return {
                    text:     '🔁 ECHO!',
                    color:    '#ff88ff',
                    size:     '18px',
                    duration: 800,
                    endScale: 1.1,
                };
            case 'phase':
                return {
                    text:     `⚡ FASE ${amount}`,
                    color:    '#ff4400',
                    size:     '22px',
                    duration: 1500,
                    endScale: 1.4,
                };
            default:
                return {
                    text:     `${amount}`,
                    color:    '#ffffff',
                    size:     '18px',
                    duration: 800,
                    endScale: 0.8,
                };
        }
    }
}