const express = require('express')
const router = express.Router()
const multer = require('multer')
const { Storage } = require('@google-cloud/storage')
const passport = require('passport')
const crypto = require('crypto')
const { Reader } = require('../models/Reader')
const utils = require('../utils/utils')

const storage = new Storage()

const m = multer({ storage: multer.memoryStorage() })
/**
 * @swagger
 * /reader-{id}/file-upload:
 *   post:
 *     tags:
 *       - readers
 *     description: POST /reader-:id/file-upload
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: the id of the reader
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: binary
 *     responses:
 *       200:
 *         description: file created
 *       400:
 *         description: No file was included with upload OR Error connecting to google bucket
 *       404:
 *         description: No reader with ID {id}
 *       403:
 *         description: Access to reader {id} disallowed
 */
module.exports = app => {
  app.use('/', router)
  router.post(
    '/reader-:id/file-upload',
    passport.authenticate('jwt', { session: false }),
    m.array('files'),
    async function (req, res) {
      const id = req.params.id
      Reader.byId(id).then(async reader => {
        if (!reader) {
          res.status(404).send(`No reader with ID ${id}`)
        } else if (!utils.checkReader(req, reader)) {
          res.status(403).send(`Access to reader ${id} disallowed`)
        } else {
          let prefix =
            process.env.NODE_ENV === 'test' ? 'reader-test-' : 'reader-storage-'

          const bucketName = prefix + req.params.id.toLowerCase()

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
      })
    }
  )
}
