const mongoose = require('mongoose')

const entrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    mood: { type: String, required: true },
    images: [{ url: String, publicId: String }],
    favorite: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    tags: [{ type: String }],
  },
  { timestamps: true },
)

module.exports = mongoose.model('Entry', entrySchema)

