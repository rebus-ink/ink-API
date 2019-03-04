const express = require('express')
const router = express.Router()
const multer = require('multer')
const { Storage } = require('@google-cloud/storage')
const passport = require('passport')
const crypto = require('crypto')

const storage = new Storage()

const m = multer({ storage: multer.memoryStorage() })

module.exports = app => {
  app.use('/', router)
  router.post(
    '/reader-:shortId/file-upload',
    passport.authenticate('jwt', { session: false }),
    m.array('files'),
    async function (req, res) {
      let prefix =
        process.env.NODE_ENV === 'test' ? 'reader-test-' : 'reader-storage-'

      const bucketName = prefix + req.params.shortId.toLowerCase()

      // TODO: check what happens if the bucket already exists
      let bucket = storage.bucket(bucketName)
      const exists = await bucket.exists()
      if (!exists[0]) {
        await storage.createBucket(bucketName)
      }

      if (!req.files) {
        res.status(400).send('no file was included in this upload')
      } else {
        let promises = []
        let response = {}
        // //
        req.files.forEach(file => {
          const extension = file.originalname.split('.').pop()
          const randomFileName = `${crypto
            .randomBytes(15)
            .toString('hex')}.${extension}`
          file.name = randomFileName
          response[
            file.originalname
          ] = `https://storage.googleapis.com/${bucketName}/${randomFileName}`
          const blob = bucket.file(file.name)
          const newPromise = new Promise((resolve, reject) => {
            blob
              .createWriteStream({
                metadata: {
                  contentType: file.mimetype // allows us to view the image in a browser instead of downloading it
                }
              })
              .on('finish', async () => {
                await blob.makePublic()
                resolve()
              })
              .on('error', err => {
                reject('upload error: ', err)
              })
              .end(file.buffer)
          })

          promises.push(newPromise)
        })

        Promise.all(promises)
          .then(() => {
            res.status(200).json(response)
          })
          .catch(err => {
            res.status(400).send(err.message)
          })
      }
    }
  )
}
