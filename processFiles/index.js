const { Storage } = require('@google-cloud/storage')
const storage = new Storage()
const { initEpub } = require('./initEpub')
const { saveFiles } = require('./saveFiles')
const { updateJob } = require('./updateJob')
const Queue = require('bull')
require('dotenv').config()
const { Publication } = require('../models/Publication')

let epubQueue
const bucketName = 'publication-file-uploads-test'

// skipping this in travis in pull requests because it doesn't have access to redis password
if (process.env.REDIS_PASSWORD) {
  epubQueue = new Queue('epub', {
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    }
  })
  epubQueue.process(async function (data, done) {
    const readerId = data.data.readerId
    const jobId = data.data.jobId
    const publicationId = data.data.publicationId
    const fileName = data.data.fileName

    bucket = storage.bucket(bucketName)
    const file = await bucket.file(fileName).download()
    const result = await initEpub(file[0])
    const book = result.book
    book.id = publicationId
    book.readerId = readerId
    try {
      await Publication.createPublication({ id: readerId }, book)
      await saveFiles(book, result.media, result.zip, storage, file, jobId)
      await bucket.file(fileName).delete()
      await updateJob(jobId, null, book.id)
    } catch (err) {
      await updateJob(jobId, err)
    }
    done()
  })
}

module.exports = epubQueue
