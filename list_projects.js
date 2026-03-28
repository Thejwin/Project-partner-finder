const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'test';

async function check() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    const Project = mongoose.model('Project', new mongoose.Schema({ title: String, requiredSkills: Array }));
    
    const projects = await Project.find({});
    console.log(`Found ${projects.length} projects`);
    
    projects.forEach(p => {
      console.log(`- Project: ${p.title}, Skills: ${JSON.stringify(p.requiredSkills)}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
