const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'test';

async function ids() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    const Project = mongoose.model('Project', new mongoose.Schema({ requiredSkills: Array }));
    const Profile = mongoose.model('Profile', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, skills: Array }));
    
    const p = await Project.findOne({ "requiredSkills.0": { $exists: true } });
    const u = await Profile.findOne({ "skills.0": { $exists: true } });

    console.log(`PROJECT_ID=${p._id}`);
    console.log(`USER_ID=${u.userId}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

ids();
