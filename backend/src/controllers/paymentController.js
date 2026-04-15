const paymentService = require('../services/paymentService')

async function checkout(req, res, next) {
  try {
    const session = await paymentService.createCheckoutSession(req.body.plan, req.user)
    res.json({ success: true, data: session })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  checkout,
}

