const Queue = require('bull')
const axios = require('axios')
require('dotenv').config()
let fileDeleteQueue

if (process.env.REDIS_PASSWORD) {
  fileDeleteQueue = new Queue('file-delete', {
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    }
  })

  fileDeleteQueue.process(async (job, done) => {
    await axios.post(
      'https://us-central1-thematic-cider-139815.cloudfunctions.net/file-delete',
      job.data
    )
    done()
  })
}

module.exports = { fileDeleteQueue }
