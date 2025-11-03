// cron/autounlock.js
const cron = require('node-cron');
const dbPool = require('../utils/dbPool'); // <-- NEW: use shared auto-reconnect pool

const unlockAfterMinutes = 5;
let running = false;

// small util
const asBool = (v) => v === true || v === 'true' || v === 1 || v === '1';

async function autoUnlockUsers() {
  if (running) {
    console.warn('[autoUnlockUsers] Previous run still in progress, skipping.');
    return;
  }
  running = true;

  const startedAt = new Date().toISOString();
  const nowMs = Date.now();
  const thresholdIso = new Date(nowMs - unlockAfterMinutes * 60 * 1000).toISOString();
  const thresholdDateOnly = thresholdIso.slice(0, 10);
  const useDateCompare = asBool(process.env.LOCKEDDATE_IS_DATE);

  const ctx = {
    function: 'autoUnlockUsers',
    threshold: useDateCompare ? thresholdDateOnly : thresholdIso,
    compareMode: useDateCompare ? 'DATE' : 'TIMESTAMP',
    startedAt
  };

  let pool;
  try {
    pool = await dbPool.getPool(); // <-- Fresh, validated pool
  } catch (err) {
    console.error('[autoUnlockUsers] Failed to get DB pool:', err);
    running = false;
    return;
  }

  try {
    // 1) Fetch locked users
    let query = `
      SELECT UserId, Email, LockedDate, UserLocked
      FROM users
      WHERE UserLocked = 'Y'
    `;
    const request = pool.request();

    if (useDateCompare) {
      query += ' AND CAST(LockedDate AS DATE) <= @threshold';
      request.input('threshold', pool.Date, thresholdDateOnly);
    } else {
      query += ' AND LockedDate <= @threshold';
      request.input('threshold', pool.DateTime, thresholdIso);
    }

    const lockedUsersData = await request.query(query);
    const lockedUsers = lockedUsersData.recordset;

    if (!lockedUsers || lockedUsers.length === 0) {
      console.info(`[autoUnlockUsers] No locked users <= ${ctx.threshold} (${ctx.compareMode}).`);
      return;
    }

    // 2) Bulk update
    let updateQuery = `
      UPDATE users
      SET UserLocked = 'N', LockedDate = NULL, InvalidAttempt = 0
      OUTPUT INSERTED.UserId, INSERTED.Email
      WHERE UserLocked = 'Y'
    `;
    const updateRequest = pool.request();

    if (useDateCompare) {
      updateQuery += ` AND CAST(LockedDate AS DATE) <= @threshold`;
      updateRequest.input('threshold', pool.Date, thresholdDateOnly);
    } else {
      updateQuery += ` AND LockedDate <= @threshold`;
      updateRequest.input('threshold', pool.DateTime, thresholdIso);
    }

    const updatedData = await updateRequest.query(updateQuery);
    const updated = updatedData.recordset;
    const updatedCount = updated.length;

    console.info(`[autoUnlockUsers] Unlocked ${updatedCount} of ${lockedUsers.length} eligible users.`);

    if (updatedCount > 0) {
      const emails = updated
        .map(u => u.Email)
        .filter(Boolean)
        .slice(0, 20);
      console.info(`[autoUnlockUsers] Sample unlocked emails (${emails.length} shown):`, emails);
    }
  } catch (err) {
    logUndiciError('Locked Users Fetch/Update', err, ctx);
  } finally {
    running = false;
  }
}

// Re-use your existing error logger
function logUndiciError(title, err, ctx = {}) {
  const toPlain = (v) => {
    try { return JSON.parse(JSON.stringify(v)); }
    catch { return typeof v === 'string' ? v : String(v); }
  };

  const eObj = err && typeof err === 'object' ? err : {};
  const cause = 'cause' in eObj ? eObj.cause : null;

  const diag = {
    timestamp: new Date().toISOString(),
    title,
    ...ctx,
    errorName: eObj.name || (err instanceof Error ? err.name : 'Error'),
    errorMessage: eObj.message || (err instanceof Error ? err.message : String(err)),
    code: eObj.code || eObj.number || '',
    details: eObj.details || '',
    hint: eObj.hint || '',
    statusText: eObj.statusText || '',
    syscall: eObj.syscall || cause?.syscall || '',
    address: eObj.address || cause?.address || '',
    port: eObj.port || cause?.port || '',
    stack: err instanceof Error && err.stack ? err.stack : undefined,
    nodeEnv: process.env.NODE_ENV,
    raw: toPlain(err)
  };

  console.error('s================================');
  console.error('=== Locked Users Error ===');
  console.error(JSON.stringify(diag, null, 2));
  console.error('================================');
}

// Export: schedule every minute
module.exports = () => {
  cron.schedule('* * * * *', autoUnlockUsers, { timezone: 'Asia/Kolkata' });
  console.log('Auto unlock scheduler started (every minute)');
};