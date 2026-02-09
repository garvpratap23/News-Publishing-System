import mongoose from 'mongoose'
import Article from '../lib/models/article'
import User from '../lib/models/user'

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Garv_news:Vragps2334@cluster0.vetvb19.mongodb.net/?appName=Cluster0'

async function clearArticles() {
  try {
    console.log('🗑️  Clearing existing articles...\n')

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // Delete all articles
    const result = await Article.deleteMany({})
    console.log(`✅ Deleted ${result.deletedCount} articles\n`)

    // Optionally, also delete all users (authors) if you want a complete fresh start
    // const userResult = await User.deleteMany({})
    // console.log(`✅ Deleted ${userResult.deletedCount} users\n`)

  } catch (error) {
    console.error('❌ Error clearing articles:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('👋 Database connection closed')
  }
}

// Run the clearing script
clearArticles()
  .then(() => {
    console.log('✅ Articles cleared successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
