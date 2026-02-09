// Script to make a user an admin
// Usage: npx tsx scripts/make-admin.ts your-email@example.com

import mongoose from 'mongoose'
import User from '../lib/models/user'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required')
  process.exit(1)
}

async function makeAdmin(identifier: string) {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Check if identifier is a valid ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier)

    let user;
    if (isObjectId) {
      user = await User.findById(identifier)
    } else {
      user = await User.findOne({ email: identifier })
    }

    if (!user) {
      console.error(`❌ User with identifier "${identifier}" not found`)
      process.exit(1)
    }

    if (user.role === 'admin') {
      console.log(`✅ User "${user.name}" (${user.email}) is already an admin`)
      process.exit(0)
    }

    user.role = 'admin'
    await user.save()

    console.log(`✅ Successfully made "${user.name}" (${user.email}) an admin!`)
    console.log(`   They can now access the admin dashboard at /admin`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

const identifier = process.argv[2]

if (!identifier) {
  console.error('❌ Please provide an email address or User ID')
  console.log('Usage: npx tsx scripts/make-admin.ts <email-or-id>')
  process.exit(1)
}

makeAdmin(identifier)
