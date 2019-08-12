const Queue = require('bull')
const request = require('request')
const { Storage } = require('@google-cloud/storage')
const utils = require('../utils/utils')
const storage = new Storage()
require('dotenv').config()

console.log(process.env)
const elasticSearchQueue = new Queue('elasticsearch', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  }
})

elasticSearchQueue.process(async (data, done) => {
  data = data.data
  const readingFileStream = storage
    .bucket(data.bucketName)
    .file(data.fileName)
    .createReadStream()
  let buf = ''
  readingFileStream
    .on('data', function (d) {
      buf += d
    })
    .on('end', async () => {
      request.post(
        `${process.env.ELASTIC_SEARCH_URL}/document/_doc/`,
        {
          auth: {
            username: process.env.ELASTIC_SEARCH_LOGIN,
            password: process.env.ELASTIC_SEARCH_PASSWORD
          },
          body: JSON.stringify({
            name: data.fileName,
            readerId: utils.urlToId(data.document.readerId),
            publicationId: data.pubId,
            documentUrl: data.document.url,
            documentId: data.document.id,
            content: buf
          }),
          headers: { 'content-type': 'application/json' }
        },
        () => {
          done()
        }
      )
    })
})

module.exports = elasticSearchQueue
