const express = require('express')
const { body } = require('express-validator')
const authController = require('./controllers/authController')
const entryController = require('./controllers/entryController')
const paymentController = require('./controllers/paymentController')
const requireAuth = require('./middlewares/auth')

const router = express.Router()

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Dreamy Diary API is healthy.' })
})

router.post(
  '/auth/signup',
  body('name').notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Email must be valid.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  authController.signup,
)

router.post(
  '/auth/login',
  body('email').isEmail().withMessage('Email must be valid.'),
  body('password').notEmpty().withMessage('Password is required.'),
  authController.login,
)

router.get('/entries', requireAuth, entryController.list)
router.post(
  '/entries',
  requireAuth,
  body('title').notEmpty().withMessage('Title is required.'),
  body('content').notEmpty().withMessage('Content is required.'),
  body('mood').notEmpty().withMessage('Mood is required.'),
  entryController.create,
)
router.patch('/entries/:id', requireAuth, entryController.update)
router.delete('/entries/:id', requireAuth, entryController.remove)
router.get('/analytics', requireAuth, entryController.analytics)
router.post('/payments/checkout', requireAuth, paymentController.checkout)

module.exports = router

