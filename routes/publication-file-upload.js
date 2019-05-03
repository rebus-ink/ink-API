const express = require('express')
const router = express.Router()
const multer = require('multer')
const { Storage } = require('@google-cloud/storage')
const passport = require('passport')
const crypto = require('crypto')
const { Publication } = require('../models/Publication')
const { Document } = require('../models/Document')
const utils = require('./utils')

const storage = new Storage()

const m = multer({ storage: multer.memoryStorage() })

module.exports = app => {
  app.use('/', router)
  router.post(
    '/publication-:id/file-upload',
    passport.authenticate('jwt', { session: false }),
    m.single('file'),
    async function (req, res) {
      const id = req.params.id
      Publication.byId(id).then(async publication => {
        if (!publication) {
          res.status(404).send(`No publication with ID ${id}`)
        } else if (!utils.checkReader(req, publication.reader)) {
          res.status(403).send(`Access to publication ${id} disallowed`)
        } else {
          let prefix =
            process.env.NODE_ENV === 'test' ? 'reader-test-' : 'reader-storage-'

          // one bucket per publication
          const bucketName = prefix + req.params.id.toLowerCase()
          const publicationId = req.params.id
          // TODO: check what happens if the bucket already exists
          let bucket = storage.bucket(bucketName)
          const exists = await bucket.exists()
          if (!exists[0]) {
            await storage.createBucket(bucketName)
          }

          if (!req.file) {
            res.status(400).send('no file was included in this upload')
          } else {
            let document = {
              documentPath: req.body.documentPath,
              mediaType: req.body.mediaType,
              json: JSON.parse(req.body.json)
            }
            // //
            const file = req.file
            const extension = file.originalname.split('.').pop()
            const randomFileName = `${crypto
              .randomBytes(15)
              .toString('hex')}.${extension}`
            file.name = randomFileName
            document.url = `https://storage.googleapis.com/${bucketName}/${randomFileName}`
            const blob = bucket.file(file.name)

            const stream = blob.createWriteStream({
              metadata: {
                contentType: req.file.mimetype // allows us to view the image in a browser instead of downloading it
              }
            })

            stream.on('error', err => {
              console.log(err.message)
              res
                .status(400)
                .send(
                  `error connecting to the google cloud bucket: ${err.message}`
                )
            })

            stream.on('finish', () => {
              blob
                .makePublic()
                .then(() => {
                  return Document.createDocument(
                    publication.reader,
                    publicationId,
                    document
                  )
                })
                .then(createdDocument => {
                  res.setHeader('Content-Type', 'application/json;')
                  res.end(JSON.stringify(createdDocument))
                })
            })

            stream.end(req.file.buffer)
          }
        }
      })
    }
  )
}
