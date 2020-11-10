const Queue = require('bull')
const request = require('request')
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
    await request.post(
      'https://us-central1-thematic-cider-139815.cloudfunctions.net/file-delete',
      {
        body: JSON.stringify(job.data),
        headers: { 'content-type': 'application/json' }
      },
      async err => {
        if (err) console.log(err)
        done()
      }
    )
  })
}

module.exports = { fileDeleteQueue }
