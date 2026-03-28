const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

async function syncSkills() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI.split('@')[1]}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database.');

    const Profile = mongoose.model('Profile', new mongoose.Schema({ skills: Array }));
    const Project = mongoose.model('Project', new mongoose.Schema({ requiredSkills: Array }));

    console.log('Collecting skills from profiles...');
    const profiles = await Profile.find({}, 'skills').lean();
    const profileSkills = profiles.flatMap(p => (p.skills || []).map(s => s.name));

    console.log('Collecting skills from projects...');
    const projects = await Project.find({}, 'requiredSkills').lean();
    const projectSkills = projects.flatMap(p => (p.requiredSkills || []).map(s => s.name));

    const allSkills = [...new Set([...profileSkills, ...projectSkills])].filter(Boolean);
    console.log(`Found ${allSkills.length} unique skills:`, allSkills);

    if (allSkills.length === 0) {
      console.log('No skills found to sync.');
      await mongoose.disconnect();
      return;
    }

    console.log(`Sending sync request to NLP service at ${NLP_SERVICE_URL}...`);
    const res = await axios.post(`${NLP_SERVICE_URL}/api/vectors/generate`, { skills: allSkills });
    
    console.log('Sync result:', res.data);
    console.log('Skill vectors ensured.');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during skill sync:', err.response?.data || err.message);
    process.exit(1);
  }
}

syncSkills();
