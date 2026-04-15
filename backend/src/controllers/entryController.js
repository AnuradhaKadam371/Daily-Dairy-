const { validationResult } = require('express-validator')
const ApiError = require('../utils/apiError')
const entryService = require('../services/entryService')

async function list(req, res, next) {
  try {
    const data = await entryService.listEntries(req.user.sub, req.query)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

async function create(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new ApiError(422, errors.array()[0].msg)
    }

    const data = await entryService.createEntry(req.user.sub, req.body)
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

async function update(req, res, next) {
  try {
    const data = await entryService.updateEntry(req.user.sub, req.params.id, req.body)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

async function remove(req, res, next) {
  try {
    await entryService.deleteEntry(req.user.sub, req.params.id)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

async function analytics(req, res, next) {
  try {
    const data = await entryService.analytics(req.user.sub)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
  analytics,
}

