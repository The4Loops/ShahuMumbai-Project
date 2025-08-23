const cron = require('node-cron');
const supabase = require('../config/supabaseClient');

const unlockAfterMinutes = 5;

const autoUnlockUsers = async () => {

  const threshold = new Date(Date.now() - unlockAfterMinutes * 60 * 1000).toISOString();

  const { data: lockedUsers, error } = await supabase
    .from('users')
    .select('*')
    .eq('userlocked', 'Y')

  // if (error) {
  //   console.error('Error fetching locked users:', error.message);
  //   return;
  // }

  if (error) {
  console.error("=== Locked Users Fetch Error ===");
  console.error("Timestamp:", new Date().toISOString());
  console.error("Function:", "fetchLockedUsers");
  
  // Log full error object
  console.error("Error object:", error);

  // Log message separately for clarity
  console.error("Error message:", error.message);

  // Log stack if available
  if (error.stack) {
    console.error("Stack trace:", error.stack);
  }

  // Optionally include context data
  console.error("Additional context:", {
    endpoint: "/api/users/locked",
    params: { /* whatever params you passed */ },
  });

  console.error("================================");
  return;
}


  for (const user of lockedUsers) {
    const { error: updateErr } = await supabase
      .from('users')
      .update({
        userlocked: 'N',
        lockeddate: null,
        invalidattempt: 0
      })
      .eq('id', user.id);

    if (updateErr) {
      console.error(`Error unlocking user ${user.email}:`, updateErr.message);
    } else {
      console.log(`✅ User ${user.email} unlocked.`);
    }
  }
};

module.exports = () => {
  // Runs every 1 minute
  cron.schedule('* * * * *', autoUnlockUsers);
};
