const app = require('./app')
const env = require('./config/env')
const connectDatabase = require('./config/db')

async function start() {
  try {
    await connectDatabase(env.mongoUri)
    app.listen(env.port, () => {
      console.log(`Dreamy Diary API running on http://localhost:${env.port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

start()
