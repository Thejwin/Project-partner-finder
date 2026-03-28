const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'test'; // Assuming default or specified

async function check() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    console.log(`Connected to ${DB_NAME}`);

    const Profile = mongoose.model('Profile', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, skills: Array }));
    const Project = mongoose.model('Project', new mongoose.Schema({ _id: mongoose.Schema.Types.ObjectId, requiredSkills: Array }));

    const userId = '69ae7d6cb6359da3cb7d0f43';
    const projectId = '69c40d27e5165c114e297826';

    const profile = await Profile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    const project = await Project.findOne({ _id: new mongoose.Types.ObjectId(projectId) });

    console.log('Profile found:', !!profile);
    if (profile) console.log('Profile skills:', JSON.stringify(profile.skills));
    
    console.log('Project found:', !!project);
    if (project) console.log('Project requiredSkills:', JSON.stringify(project.requiredSkills));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
