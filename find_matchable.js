const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'test';

async function findMatchable() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    const Project = mongoose.model('Project', new mongoose.Schema({ title: String, requiredSkills: Array }));
    const Profile = mongoose.model('Profile', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, skills: Array }));
    
    const projects = await Project.find({ "requiredSkills.0": { $exists: true } });
    const profiles = await Profile.find({ "skills.0": { $exists: true } });

    console.log(`Found ${projects.length} matchable projects`);
    if (projects.length > 0) {
        console.log(`First Project ID: ${projects[0]._id}, Title: ${projects[0].title}`);
    }

    console.log(`Found ${profiles.length} matchable profiles`);
    if (profiles.length > 0) {
        console.log(`First User ID (from profile): ${profiles[0].userId}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findMatchable();
