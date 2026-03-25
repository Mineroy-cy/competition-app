const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const WeeklyRecord = require('./models/WeeklyRecord');

const fixHistory = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("Connected to MongoDB.");

    // Group by user
    const records = await WeeklyRecord.find().sort({ createdAt: 1 });
    
    // Track sequential number per user
    const userWeeks = {};

    for (const record of records) {
      const uId = record.user.toString();
      if (!userWeeks[uId]) userWeeks[uId] = 0;
      userWeeks[uId]++;
      
      record.weekNumber = userWeeks[uId];
      await record.save();
      console.log(`Updated Record ${record._id} for user ${uId} to weekNumber ${record.weekNumber}`);
    }
    
    console.log("Successfully re-numbered history weeks sequentially!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

fixHistory();
