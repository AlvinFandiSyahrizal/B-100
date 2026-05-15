const SAVE_KEY    = 'dungeon_b100_run';
const META_KEY    = 'dungeon_b100_meta';
const VERSION_KEY = 'dungeon_b100_ver';
const SAVE_VERSION = '0.1.0';

export class SaveSystem {

    static autoSave(sceneData) {
        
        const runData = {
            zone:          sceneData.zone          || 1,
            floor:         sceneData.floor         || 1,
            curseLevel:    sceneData.curseLevel    || 1,
            playerData:    sceneData.playerData    || null,
            mapData:       sceneData.mapData       || null,
            // Simpan node SEBELUM masuk, bukan node yang sedang dikunjungi
            // Sehingga saat resume, player kembali ke peta bukan ke dalam combat
            currentNodeId: 'start',
            savedAt:       Date.now(),
        };
        this.saveRun(runData);
    }

    /** Simpan state run saat ini. */
    static saveRun(runData) {
        try {
            const payload = {
                version:   SAVE_VERSION,
                savedAt:   Date.now(),
                run:       runData,
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
            console.log('[SaveSystem] Run berhasil disimpan.');
            return true;
        } catch (err) {
            console.error('[SaveSystem] Gagal simpan:', err);
            return false;
        }
    }

    /** Load state run yang tersimpan. Return null kalau tidak ada. */
    static loadRun() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;

            const payload = JSON.parse(raw);

            // Cek versi
            if (payload.version !== SAVE_VERSION) {
                console.warn('[SaveSystem] Versi save tidak cocok, hapus save lama.');
                this.clearRun();
                return null;
            }

            console.log('[SaveSystem] Run berhasil dimuat.');
            return payload.run;
        } catch (err) {
            console.error('[SaveSystem] Gagal load:', err);
            return null;
        }
    }

    /** Ada run yang tersimpan? */
    static hasRun() {
        return !!localStorage.getItem(SAVE_KEY);
    }

    /** Hapus save run (setelah game over atau menang). */
    static clearRun() {
        localStorage.removeItem(SAVE_KEY);
        console.log('[SaveSystem] Run dihapus.');
    }

    // ── Meta Progression ──────────────────────────────────────

    /** Simpan data meta (permanen antar run). */
    static saveMeta(metaData) {
        try {
            localStorage.setItem(META_KEY, JSON.stringify({
                version: SAVE_VERSION,
                meta:    metaData,
            }));
            return true;
        } catch (err) {
            console.error('[SaveSystem] Gagal simpan meta:', err);
            return false;
        }
    }

    /** Load data meta. Return objek kosong kalau belum ada. */
    static loadMeta() {
        try {
            const raw = localStorage.getItem(META_KEY);
            if (!raw) return this._defaultMeta();

            const payload = JSON.parse(raw);
            return payload.meta || this._defaultMeta();
        } catch (err) {
            console.error('[SaveSystem] Gagal load meta:', err);
            return this._defaultMeta();
        }
    }

    static _defaultMeta() {
        return {
            totalRuns:         0,
            bestFloor:         0,
            totalKills:        0,
            unlockedCompanions: [],
            defeatedBosses:    [],
            bestiary:          {},  // monster yang pernah dikalahkan
        };
    }

    /** Update satu field meta setelah run selesai. */
    static updateMeta(updates) {
        const meta = this.loadMeta();
        Object.assign(meta, updates);
        this.saveMeta(meta);
    }

    /** Rekam hasil run ke meta. */
    static recordRun({ floor, kills, won }) {
        const meta = this.loadMeta();
        meta.totalRuns++;
        meta.totalKills += kills || 0;
        if (floor > meta.bestFloor) meta.bestFloor = floor;
        this.saveMeta(meta);
    }

    /** Tambah monster ke bestiary. */
    static addToBestiary(monsterId) {
        const meta = this.loadMeta();
        if (!meta.bestiary[monsterId]) {
            meta.bestiary[monsterId] = { firstSeen: Date.now(), kills: 0 };
        }
        meta.bestiary[monsterId].kills++;
        this.saveMeta(meta);
    }
}