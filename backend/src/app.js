const cors = require('cors')
const express = require('express')
const morgan = require('morgan')
const env = require('./config/env')
const rateLimiter = require('./middlewares/rateLimiter')
const errorHandler = require('./middlewares/errorHandler')
const routes = require('./routes')

const app = express()

app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(rateLimiter)
app.use('/api', routes)
app.use(errorHandler)

module.exports = app

