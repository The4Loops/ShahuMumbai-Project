// const cron = require('node-cron');
// const supabase = require('../config/supabaseClient');

// const unlockAfterMinutes = 5;

// const autoUnlockUsers = async () => {

//   const threshold = new Date(Date.now() - unlockAfterMinutes * 60 * 1000).toISOString();

//   const { data: lockedUsers, error } = await supabase
//     .from('users')
//     .select('*')
//     .eq('userlocked', 'Y')

//   // if (error) {
//   //   console.error('Error fetching locked users:', error.message);
//   //   return;
//   // }

//   if (error) {
//   console.error("=== Locked Users Fetch Error ===");
//   console.error("Timestamp:", new Date().toISOString());
//   console.error("Function:", "fetchLockedUsers");
  
//   // Log full error object
//   console.error("Error object:", error);

//   // Log message separately for clarity
//   console.error("Error message:", error.message);

//   // Log stack if available
//   if (error.stack) {
//     console.error("Stack trace:", error.stack);
//   }

//   // Optionally include context data
//   console.error("Additional context:", {
//     endpoint: "/api/users/locked",
//     params: { /* whatever params you passed */ },
//   });

//   console.error("================================");
//   return;
// }


//   for (const user of lockedUsers) {
//     const { error: updateErr } = await supabase
//       .from('users')
//       .update({
//         userlocked: 'N',
//         lockeddate: null,
//         invalidattempt: 0
//       })
//       .eq('id', user.id);

//     if (updateErr) {
//       console.error(`Error unlocking user ${user.email}:`, updateErr.message);
//     } else {
//       console.log(`✅ User ${user.email} unlocked.`);
//     }
//   }
// };

// module.exports = () => {
//   // Runs every 1 minute
//   cron.schedule('* * * * *', autoUnlockUsers);
// };



const cron = require('node-cron');
const supabase = require('../config/supabaseClient');

const unlockAfterMinutes = 5;
let running = false; // prevent overlap

async function autoUnlockUsers() {
  if (running) {
    console.warn('[autoUnlockUsers] Previous run still in progress, skipping.');
    return;
  }
  running = true;

  const startTs = new Date().toISOString();
  const threshold = new Date(Date.now() - unlockAfterMinutes * 60 * 1000).toISOString();

  // Fast sanity checks so "fetch failed" doesn’t hide obvious config issues
  if (!process.env.SUPABASE_URL || !/^https?:\/\//i.test(process.env.SUPABASE_URL)) {
    console.error('[autoUnlockUsers] Invalid SUPABASE_URL:', process.env.SUPABASE_URL);
    running = false; return;
  }
  if (!process.env.SUPABASE_KEY) {
    console.error('[autoUnlockUsers] Missing Supabase key env (SERVICE_ROLE_KEY or ANON_KEY).');
    running = false; return;
  }

  try {
    // 1) (Optional) Read which users would be unlocked — helps verify select works.
    const { data: lockedUsers, error: selectErr } = await supabase
      .from('users')
      .select('id,email,lockeddate,userlocked')
      .eq('userlocked', 'Y')
      .lte('lockeddate', threshold);

    if (selectErr) {
      logUndiciError('Locked Users Fetch', selectErr, {
        function: 'autoUnlockUsers',
        phase: 'select_locked_users',
        threshold,
      });
      return;
    }

    // 2) Single-shot update (no per-user loop) + return affected rows for logging
    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update({ userlocked: 'N', lockeddate: null, invalidattempt: 0 })
      .eq('userlocked', 'Y')
      .lte('lockeddate', threshold)
      .select('id,email'); // return changed rows

    if (updateErr) {
      logUndiciError('Unlock Update', updateErr, {
        function: 'autoUnlockUsers',
        phase: 'bulk_update',
        threshold,
        candidates: lockedUsers?.length ?? 0,
      });
      return;
    }

    console.log(
      `✅ [autoUnlockUsers] ${updated?.length || 0} user(s) unlocked at ${new Date().toISOString()} (threshold ${threshold}).`
    );

  } catch (err) {
    // This catches truly thrown errors (e.g., AbortError/timeouts if you add them)
    logUndiciError('Unexpected', err, { function: 'autoUnlockUsers', phase: 'unexpected', when: startTs });
  } finally {
    running = false;
  }
}

function logUndiciError(title, err, ctx = {}) {
  const e = err instanceof Error ? err : new Error(String(err));
  const cause = e && typeof e === 'object' ? e.cause : null;

  const diag = {
    timestamp: new Date().toISOString(),
    title,
    ...ctx,
    errorName: e.name,
    errorMessage: e.message,
    causeName: cause?.name,
    causeMessage: cause?.message,
    code: cause?.code || err?.code || '',      // e.g. ECONNREFUSED/ENOTFOUND/ETIMEDOUT
    syscall: cause?.syscall || '',
    address: cause?.address || '',
    port: cause?.port || '',
    stack: e.stack,
    supabaseUrl: process.env.SUPABASE_URL,      // safe to print; avoid printing keys
    nodeEnv: process.env.NODE_ENV,
  };

  console.error('=== Locked Users Fetch Error ===');
  console.error(JSON.stringify(diag, null, 2));
  console.error('================================');
}

module.exports = () => {
  // Every minute, India time
  cron.schedule('* * * * *', autoUnlockUsers, { timezone: 'Asia/Kolkata' });
};
