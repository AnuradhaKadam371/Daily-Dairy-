const Entry = require('../models/Entry')
const User = require('../models/User')

async function listEntries(userId, query) {
  const filters = { userId }

  if (query.keyword) {
    filters.$or = [
      { title: { $regex: query.keyword, $options: 'i' } },
      { content: { $regex: query.keyword, $options: 'i' } },
    ]
  }

  if (query.mood) {
    filters.mood = query.mood
  }

  if (query.favorite === 'true') {
    filters.favorite = true
  }

  if (query.date) {
    const start = new Date(query.date)
    const end = new Date(query.date)
    end.setDate(end.getDate() + 1)
    filters.createdAt = { $gte: start, $lt: end }
  }

  const page = Number(query.page || 1)
  const limit = Number(query.limit || 10)

  const items = await Entry.find(filters)
    .sort({ pinned: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)

  const total = await Entry.countDocuments(filters)

  return { items, total, page, limit }
}

async function createEntry(userId, payload) {
  const entry = await Entry.create({ ...payload, userId })

  const user = await User.findById(userId)
  if (user) {
    const today = new Date().toDateString()
    const last = user.lastEntryDate ? new Date(user.lastEntryDate).toDateString() : null
    if (last !== today) {
      user.streakCount += 1
      user.lastEntryDate = new Date()
      await user.save()
    }
  }

  return entry
}

async function updateEntry(userId, entryId, payload) {
  return Entry.findOneAndUpdate({ _id: entryId, userId }, payload, { new: true })
}

async function deleteEntry(userId, entryId) {
  return Entry.findOneAndDelete({ _id: entryId, userId })
}

async function analytics(userId) {
  const moodCounts = await Entry.aggregate([
    { $match: { userId: Entry.db.base.Types.ObjectId.createFromHexString(userId) } },
    { $group: { _id: '$mood', total: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ])

  const entries = await Entry.find({ userId }).sort({ createdAt: -1 })
  const today = new Date()
  const onThisDay = entries.filter((entry) => {
    const entryDate = new Date(entry.createdAt)
    return (
      entryDate.getDate() === today.getDate() &&
      entryDate.getMonth() === today.getMonth() &&
      entryDate.getFullYear() !== today.getFullYear()
    )
  })

  return {
    moodCounts,
    onThisDay,
    totalEntries: entries.length,
  }
}

module.exports = {
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  analytics,
}

