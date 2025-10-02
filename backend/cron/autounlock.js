const cron = require('node-cron');
const sql = require('mssql');
const sqlConfig = require('../config/db');

const unlockAfterMinutes = 5;
let running = false;
let pool;

// small util
const asBool = (v) => v === true || v === 'true' || v === 1 || v === '1';

async function initPool() {
  try {
    pool = await sql.connect(sqlConfig);
    console.log('MSSQL pool connected for autounlock cron');
  } catch (err) {
    console.error('Failed to connect MSSQL pool for autounlock cron:', err);
    throw err;
  }
}

async function autoUnlockUsers() {
  if (running) {
    console.warn('[autoUnlockUsers] Previous run still in progress, skipping.');
    return;
  }
  running = true;

  const startedAt = new Date().toISOString();

  // Compute threshold once per run
  const nowMs = Date.now();
  const thresholdIso = new Date(nowMs - unlockAfterMinutes * 60 * 1000).toISOString();
  // For DATE columns we must compare 'YYYY-MM-DD'
  const thresholdDateOnly = thresholdIso.slice(0, 10);
  const useDateCompare = asBool(process.env.LOCKEDDATE_IS_DATE);

  const ctx = {
    function: 'autoUnlockUsers',
    threshold: useDateCompare ? thresholdDateOnly : thresholdIso,
    compareMode: useDateCompare ? 'DATE' : 'TIMESTAMP',
    startedAt
  };

  try {
    // 1) Who is currently eligible to unlock?
    let query = `
      SELECT UserId, Email, LockedDate, UserLocked
      FROM users
      WHERE UserLocked = 'Y'
    `;
    const parameters = [];

    if (useDateCompare) {
      query += ' AND CAST(LockedDate AS DATE) <= @threshold';
      parameters.push({ name: 'threshold', type: sql.Date, value: thresholdDateOnly });
    } else {
      query += ' AND LockedDate <= @threshold';
      parameters.push({ name: 'threshold', type: sql.DateTime, value: thresholdIso });
    }

    const lockedUsersResult = await pool.request();
    parameters.forEach(param => lockedUsersResult.input(param.name, param.type, param.value));
    const lockedUsersData = await lockedUsersResult.query(query);

    const lockedUsers = lockedUsersData.recordset;
    if (!lockedUsers || lockedUsers.length === 0) {
      console.info(`[autoUnlockUsers] No locked users <= ${ctx.threshold} (${ctx.compareMode}).`);
      return;
    }

    // 2) Bulk update
    const updateQuery = `
      UPDATE users
      SET UserLocked = 'N', LockedDate = NULL, InvalidAttempt = 0
      OUTPUT INSERTED.UserId, INSERTED.Email
      WHERE UserLocked = 'Y'
    `;
    if (useDateCompare) {
      updateQuery += ` AND CAST(LockedDate AS DATE) <= @threshold`;
      const updateRequest = pool.request().input('threshold', sql.Date, thresholdDateOnly);
      const updatedData = await updateRequest.query(updateQuery);
      const updated = updatedData.recordset;
      const updatedCount = updated.length;
      console.info(`[autoUnlockUsers] Unlocked ${updatedCount} of ${lockedUsers.length} eligible users (<= ${ctx.threshold}, ${ctx.compareMode}).`);
    } else {
      updateQuery += ` AND LockedDate <= @threshold`;
      const updateRequest = pool.request().input('threshold', sql.DateTime, thresholdIso);
      const updatedData = await updateRequest.query(updateQuery);
      const updated = updatedData.recordset;
      const updatedCount = updated.length;
      console.info(`[autoUnlockUsers] Unlocked ${updatedCount} of ${lockedUsers.length} eligible users (<= ${ctx.threshold}, ${ctx.compareMode}).`);
    }

    if (updatedCount > 0) {
      // Keep log concise but useful
      const emails = updated
        .map((u) => u.Email)
        .filter(Boolean)
        .slice(0, 20); // cap to avoid huge logs
      console.info(`[autoUnlockUsers] Sample unlocked emails (${emails.length} shown):`, emails);
    }
  } catch (err) {
    logUndiciError('Locked Users Fetch/Update', err, ctx);
  } finally {
    running = false;
  }
}

/**
 * Better error logger for MSSQL errors.
 * - Preserves object fields (code, details, hint, status)
 * - Keeps a (safe) raw snapshot for debugging
 */
function logUndiciError(title, err, ctx = {}) {
  const toPlain = (v) => {
    try {
      return JSON.parse(JSON.stringify(v));
    } catch {
      // last resort
      return typeof v === 'string' ? v : String(v);
    }
  };

  const eObj = (err && typeof err === 'object') ? err : {};
  const cause = 'cause' in eObj ? eObj.cause : null;

  const diag = {
    timestamp: new Date().toISOString(),
    title,
    ...ctx,

    // High-level
    errorName: eObj.name || (err instanceof Error ? err.name : 'Error'),
    errorMessage: eObj.message || (err instanceof Error ? err.message : String(err)),

    // MSSQL fields
    code: eObj.code || eObj.number || '',
    details: eObj.details || '',
    hint: eObj.hint || '',
    statusText: eObj.statusText || '',

    // Network/undici style hints
    syscall: eObj.syscall || cause?.syscall || '',
    address: eObj.address || cause?.address || '',
    port: eObj.port || cause?.port || '',

    // Stack (when available)
    stack: (err instanceof Error && err.stack) ? err.stack : undefined,

    // Safe env context
    nodeEnv: process.env.NODE_ENV,

    // Raw snapshot (safe-stringified)
    raw: toPlain(err)
  };

  console.error('s================================');
  console.error('=== Locked Users Fetch Error ===');
  console.error(JSON.stringify(diag, null, 2));
  console.error('================================');
}

// Export: schedule every minute (Asia/Kolkata)
module.exports = async () => {
  try {
    await initPool();
  } catch (err) {
    console.error('Failed to initialize pool for autounlock cron:', err);
    return;
  }

  cron.schedule('* * * * *', autoUnlockUsers, { timezone: 'Asia/Kolkata' });

  console.log('Auto unlock scheduler started');
};