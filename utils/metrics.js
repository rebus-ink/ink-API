const { urlToId } = require('./utils')
const crypto = require('crypto')
const Queue = require('bull')
const request = require('request')
require('dotenv').config()
let metricsQueue

if (
  process.env.REDIS_PASSWORD &&
  (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'dev')
) {
  metricsQueue = new Queue('metrics', {
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    }
  })

  metricsQueue.process(async (job, done) => {
    let metrics = {
      type: job.data.type,
      env: process.env.NODE_ENV,
      user: crypto
        .createHash('sha256')
        .update(urlToId(job.data.readerId))
        .digest('hex')
    }

    request.post(
      'https://us-central1-thematic-cider-139815.cloudfunctions.net/metrics',
      {
        body: JSON.stringify(metrics),
        headers: { 'content-type': 'application/json' }
      },
      async err => {
        if (err) console.log(err)
        done()
      }
    )
  })
}

module.exports = { metricsQueue }
