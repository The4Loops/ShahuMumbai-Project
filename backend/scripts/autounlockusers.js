require('dotenv').config();
const supabase = require('../config/supabaseClient');

const unlockAfterHours = 1;

(async () => {
  const threshold = new Date(Date.now() - unlockAfterHours * 60 * 60 * 1000).toISOString();

  const { data: lockedUsers, error } = await supabase
    .from('Users')
    .select('*')
    .eq('userlocked', 'Y')
    .lte('lockeddate', threshold);

  if (error) {
    console.error('Error fetching locked users:', error.message);
    return;
  }

  for (const user of lockedUsers) {
    const { error: updateErr } = await supabase
      .from('Users')
      .update({
        userlocked: 'N',
        lockeddate: null,
        InvalidAttempt: 0
      })
      .eq('id', user.id);

    if (updateErr) {
      console.error(`Error unlocking user ${user.email}:`, updateErr.message);
    } else {
      console.log(`User ${user.email} unlocked successfully.`);
    }
  }
})();
