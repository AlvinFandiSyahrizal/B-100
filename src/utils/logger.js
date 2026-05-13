// ============================================================
// logger.js — debug logger yang bisa dimatikan di production
// ============================================================

const IS_DEV = true;   // ganti false sebelum deploy ke hosting

export const logger = {
    log:   (...args) => IS_DEV && console.log('[Game]', ...args),
    warn:  (...args) => console.warn('[Game]', ...args),
    error: (...args) => console.error('[Game]', ...args),
    combat:(...args) => IS_DEV && console.log('[Combat]', ...args),
    data:  (...args) => IS_DEV && console.log('[Data]', ...args),
};

