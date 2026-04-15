const bcrypt = require('bcryptjs')
const User = require('../models/User')
const ApiError = require('../utils/apiError')
const { signToken } = require('../utils/jwt')

async function signup({ name, email, password }) {
  const existing = await User.findOne({ email })
  if (existing) {
    throw new ApiError(409, 'An account with that email already exists.')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, passwordHash })
  const token = signToken({ sub: user.id, role: user.role, email: user.email })

  return { user, token }
}

async function login({ email, password }) {
  const user = await User.findOne({ email })
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.')
  }

  const matches = await bcrypt.compare(password, user.passwordHash)
  if (!matches) {
    throw new ApiError(401, 'Invalid email or password.')
  }

  const token = signToken({ sub: user.id, role: user.role, email: user.email })
  return { user, token }
}

module.exports = {
  signup,
  login,
}

