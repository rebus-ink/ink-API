// NOT CURRENTLY USED

const { urlToId } = require('./utils')
const crypto = require('crypto')
const Queue = require('bull')
const axios = require('axios')
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

    await axios.post(
      'https://us-central1-thematic-cider-139815.cloudfunctions.net/metrics',
      metrics
    )
    done()
  })
}

module.exports = { metricsQueue }
