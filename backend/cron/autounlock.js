// backend/cron/autounlock.js
const cron = require('node-cron');
const supabase = require('../config/supabaseClient');

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

  // Compute threshold once per run
  const nowMs = Date.now();
  const thresholdIso = new Date(nowMs - unlockAfterMinutes * 60 * 1000).toISOString();
  // For DATE columns we must compare 'YYYY-MM-DD'
  const thresholdDateOnly = thresholdIso.slice(0, 10);
  const useDateCompare = asBool(process.env.LOCKEDDATE_IS_DATE);

  // Basic sanity checks: URL + some key present
  if (!process.env.SUPABASE_URL || !/^https?:\/\//i.test(process.env.SUPABASE_URL)) {
    console.error('[autoUnlockUsers] Invalid SUPABASE_URL:', process.env.SUPABASE_URL);
    running = false;
    return;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY) {
    console.error('[autoUnlockUsers] Missing Supabase key env (prefer SUPABASE_SERVICE_ROLE_KEY).');
    running = false;
    return;
  }

  const ctx = {
    function: 'autoUnlockUsers',
    threshold: useDateCompare ? thresholdDateOnly : thresholdIso,
    compareMode: useDateCompare ? 'DATE' : 'TIMESTAMP',
    startedAt
  };

  try {
    // 1) Who is currently eligible to unlock?
    const { data: lockedUsers } = await supabase
      .from('users')
      .select('id,email,lockeddate,userlocked')
      .eq('userlocked', 'Y')
      .lte('lockeddate', useDateCompare ? thresholdDateOnly : thresholdIso)
      .throwOnError();

    if (!lockedUsers || lockedUsers.length === 0) {
      console.info(`[autoUnlockUsers] No locked users <= ${ctx.threshold} (${ctx.compareMode}).`);
      return;
    }

    // 2) Bulk update
    const { data: updated } = await supabase
      .from('users')
      .update({ userlocked: 'N', lockeddate: null, invalidattempt: 0 })
      .eq('userlocked', 'Y')
      .lte('lockeddate', useDateCompare ? thresholdDateOnly : thresholdIso)
      .select('id,email')
      .throwOnError();

    const updatedCount = updated?.length || 0;
    const candidateCount = lockedUsers.length;

    console.info(
      `[autoUnlockUsers] Unlocked ${updatedCount} of ${candidateCount} eligible users (<= ${ctx.threshold}, ${ctx.compareMode}).`
    );

    if (updatedCount > 0) {
      // Keep log concise but useful
      const emails = updated
        .map((u) => u.email)
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
 * Better error logger for Supabase/PostgREST/undici/Node errors.
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

    // Supabase/PostgREST fields
    code: eObj.code || eObj.status || '',
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
    supabaseUrl: process.env.SUPABASE_URL,
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
module.exports = () => {
  cron.schedule('* * * * *', autoUnlockUsers, { timezone: 'Asia/Kolkata' });
};
