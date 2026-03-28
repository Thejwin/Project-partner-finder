const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'test';

async function check() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    const SkillVector = mongoose.model('SkillVector', new mongoose.Schema({ name: String, vector: Array }));
    
    const count = await SkillVector.countDocuments({});
    console.log(`Found ${count} skill vectors`);
    
    if (count > 0) {
      const first = await SkillVector.findOne({});
      console.log(`Example: ${first.name}, Vector length: ${first.vector ? first.vector.length : 0}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
