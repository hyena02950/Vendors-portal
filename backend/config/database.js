
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI not defined in environment variables');
    }

    const options = {
      serverSelectionTimeoutMS: 30000, // Increased timeout
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      bufferCommands: false, // Disable mongoose buffering
      authSource: 'admin'
    };

    console.log('🔄 Attempting to connect to MongoDB...');
    await mongoose.connect(uri, options);

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`👤 User: ${mongoose.connection.user || 'none'}`);

    return mongoose.connection;

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('Troubleshooting:');
    console.log('- Verify MONGODB_URI in .env');
    console.log('- Check MongoDB server status');
    console.log('- Validate network connectivity');
    console.log('- Confirm authentication credentials');
    
    // Don't exit process immediately, let the app handle the error
    throw error;
  }
};

// Connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🛑 Mongoose connection closed (app termination)');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
  process.exit(0);
});

export default connectDB;
