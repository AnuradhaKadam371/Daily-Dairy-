const ApiError = require('../utils/apiError')
const { verifyToken } = require('../utils/jwt')

function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authorization token missing.'))
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch {
    next(new ApiError(401, 'Invalid or expired token.'))
  }
}

module.exports = requireAuth

