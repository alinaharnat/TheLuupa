import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Schedule from '../models/schedule.js';
import connectDB from '../config/connectDB.js';

dotenv.config();

await connectDB();

try {
  const schedules = await Schedule.find().sort({ departureTime: 1 }).limit(5);

  console.log('\n=== First 5 schedules in database ===\n');
  schedules.forEach((schedule, index) => {
    console.log(`Schedule ${index + 1}:`);
    console.log('  Departure (ISO):', schedule.departureTime.toISOString());
    console.log('  Departure (Local):', schedule.departureTime.toString());
    console.log('  Date only:', schedule.departureTime.toLocaleDateString('en-GB'));
    console.log('');
  });

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-GB');
  console.log('Today is:', todayStr);
  console.log('Today ISO:', today.toISOString());

} catch (error) {
  console.error('Error:', error);
} finally {
  await mongoose.connection.close();
}
