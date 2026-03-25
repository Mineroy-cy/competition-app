const cron = require('node-cron');
const User = require('../models/User');
const { archiveCurrentWeekForUser } = require('./archiveHelper');

const startCronJobs = () => {
  // Run every Monday at 00:00 (minute 0, hour 0, dom *, month *, dow 1)
  cron.schedule('0 0 * * 1', async () => {
    console.log('Cron Job: Running automatic weekly rollover...'.yellow.bold);
    try {
      // Find all users
      const users = await User.find({ status: 'active' });
      let processedCount = 0;
      
      for (const user of users) {
        const record = await archiveCurrentWeekForUser(user._id);
        if (record) processedCount++;
      }
      
      console.log(`Cron Job: Successfully rolled over ${processedCount} users.`.cyan.bold);
    } catch (err) {
      console.error(`Cron Job Error: ${err.message}`.red.bold);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
};

module.exports = { startCronJobs };
