import mongoose, { Schema, Document, Model } from 'mongoose'

export type ArticleStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived'

export interface IArticle extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  slug: string
  content: string
  excerpt: string
  bannerImage: string
  author: mongoose.Types.ObjectId
  category: string
  tags: string[]
  status: ArticleStatus
  views: number
  likes: mongoose.Types.ObjectId[]
  dislikes: mongoose.Types.ObjectId[]
  editorFeedback?: string
  publishedAt?: Date
  scheduledAt?: Date
  isBreaking?: boolean
  createdAt: Date
  updatedAt: Date
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
      default: '',
    },
    bannerImage: {
      type: String,
      default: '',
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Politics',
        'Business',
        'Technology',
        'Sports',
        'Entertainment',
        'Science',
        'Health',
        'World',
        'India',
        'Global',
        'Opinion',
        'Lifestyle',
      ],
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'published', 'rejected', 'archived'],
      default: 'draft',
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dislikes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    editorFeedback: {
      type: String,
      default: '',
    },
    publishedAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
    },
    isBreaking: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for faster queries
ArticleSchema.index({ slug: 1 })
ArticleSchema.index({ author: 1 })
ArticleSchema.index({ category: 1 })
ArticleSchema.index({ status: 1 })
ArticleSchema.index({ publishedAt: -1 })
ArticleSchema.index({ views: -1 })
ArticleSchema.index({ title: 'text', content: 'text' })

// Generate slug from title before saving
ArticleSchema.pre('save', async function () {
  if (this.isModified('title') && !this.slug) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-') +
      '-' +
      Date.now()
  }
})

const Article: Model<IArticle> =
  mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema)

export default Article
