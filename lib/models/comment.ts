import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId
  article: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  parent?: mongoose.Types.ObjectId
  text: string
  likes: mongoose.Types.ObjectId[]
  dislikes: mongoose.Types.ObjectId[]
  isFlagged: boolean
  isHidden: boolean
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>(
  {
    article: {
      type: Schema.Types.ObjectId,
      ref: 'Article',
      required: [true, 'Article is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
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
    isFlagged: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for faster queries
CommentSchema.index({ article: 1 })
CommentSchema.index({ user: 1 })
CommentSchema.index({ parent: 1 })
CommentSchema.index({ createdAt: -1 })

const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema)

export default Comment
