const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'test';
const NLP_SERVICE_URL = 'http://localhost:8000';

async function verify() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    const Project = mongoose.model('Project', new mongoose.Schema({ requiredSkills: Array }));
    const Profile = mongoose.model('Profile', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, skills: Array }));
    
    const p = await Project.findOne({ "requiredSkills.0": { $exists: true } });
    const u = await Profile.findOne({ "skills.0": { $exists: true } });

    if (!p || !u) {
        console.log('Could not find matchable data.');
        return;
    }

    console.log(`Testing match between User ${u.userId} and Project ${p._id}`);
    const res = await axios.post(`${NLP_SERVICE_URL}/api/match/compute`, {
        userId: u.userId.toString(),
        projectId: p._id.toString()
    });

    console.log('Match Result:', JSON.stringify(res.data, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

verify();
