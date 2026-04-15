const { validationResult } = require('express-validator')
const authService = require('../services/authService')
const ApiError = require('../utils/apiError')

async function signup(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new ApiError(422, errors.array()[0].msg)
    }

    const data = await authService.signup(req.body)
    res.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new ApiError(422, errors.array()[0].msg)
    }

    const data = await authService.login(req.body)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  signup,
  login,
}

