require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User.model');
const Profile = require('../src/models/Profile.model');

async function createAdmin() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is missing from environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@projectconnect.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists. Email:', adminEmail);
      if (existingAdmin.role !== 'admin') {
        console.log('Updating existing user to have admin role...');
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('User role updated successfully.');
      }
    } else {
      console.log('Creating new admin user...');
      const adminUserId = new mongoose.Types.ObjectId();

      const adminProfile = new Profile({
        userId: adminUserId,
        name: 'System Administrator',
        header: 'Managing ProjectConnect',
        skills: [{ name: 'Administration', level: 'expert' }]
      });
      await adminProfile.save();

      const newAdmin = new User({
        _id: adminUserId,
        username: 'admin',
        email: adminEmail,
        password: 'AdminPassword123!', // Strong default password
        role: 'admin',
        profileId: adminProfile._id,
        termsAccepted: true
      });
      
      await newAdmin.save();

      console.log('Admin user created successfully.');
      console.log('Email:', adminEmail);
      console.log('Password:', 'AdminPassword123!');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createAdmin();
