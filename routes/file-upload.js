const express = require('express')
const router = express.Router()
const multer = require('multer')
const { Storage } = require('@google-cloud/storage')
const passport = require('passport')

const storage = new Storage()

const m = multer({ storage: multer.memoryStorage() })

module.exports = app => {
  app.use('/', router)
  router.post(
    '/file-upload',
    passport.authenticate('jwt', { session: false }),
    m.single('file'),
    async function (req, res) {
      // currently putting all the files in a single bucket
      const bucketName = 'rebus-default-bucket'
      let bucket = storage.bucket(bucketName)

      if (!req.file) {
        res.status(400).send('no file was included in this upload')
      } else {
        const blob = bucket.file(req.file.originalname)

        const stream = blob.createWriteStream({
          metadata: {
            contentType: req.file.mimetype // allows us to view the image in a browser instead of downloading it
          }
        })

        stream.on('error', err => {
          console.log(err.message)
          res
            .status(400)
            .send(`error connecting to the google cloud bucket: ${err.message}`)
        })

        stream.on('finish', () => {
          let url = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
          // we might want to remove the makePublic
          blob.makePublic().then(() => {
            res.setHeader('Content-Type', 'application/json;')
            res.end(JSON.stringify({ url }))
          })
        })

        stream.end(req.file.buffer)
      }
    }
  )
}
