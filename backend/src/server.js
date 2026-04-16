const app = require('./app')
const env = require('./config/env')
const connectDatabase = require('./config/db')

async function start() {
  try {
    await connectDatabase(env.mongoUri)

    const PORT = process.env.PORT || env.port || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    })

  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

start()