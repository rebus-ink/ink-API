const express = require('express')
const router = express.Router()
const multer = require('multer')
const { Storage } = require('@google-cloud/storage')
const passport = require('passport')
const crypto = require('crypto')
const { Publication } = require('../models/Publication')
const { Document } = require('../models/Document')
const utils = require('../utils/utils')
const boom = require('@hapi/boom')

const storage = new Storage()
const elasticsearchQueue = require('../utils/queue')

const m = multer({ storage: multer.memoryStorage() })
/**
 * @swagger
 * /publication-{id}/file-upload:
 *   post:
 *     tags:
 *       - publications
 *     description: POST /publication-:id/file-upload
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: the id of the publication
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: binary
 *               documentPath:
 *                 type: string
 *               mediaType:
 *                 type: string
 *               json:
 *                 type: string
 *                 description: stringified json data
 *     responses:
 *       200:
 *         description: file created
 *       400:
 *         description: No file was included with upload OR Error connecting to google bucket
 *       404:
 *         description: No publication with ID {id}
 *       403:
 *         description: Access to publication {id} disallowed
 */
module.exports = app => {
  app.use('/', router)
  router.post(
    '/publication-:id/file-upload',
    passport.authenticate('jwt', { session: false }),
    m.single('file'),
    async function (req, res, next) {
      const id = req.params.id
      let bucketName
      Publication.byId(id).then(async publication => {
        if (!publication) {
          return next(
            boom.notFound(`No publication with ID ${id}`, {
              type: 'Publication',
              id,
              activity: 'Upload File to Publication'
            })
          )
        } else if (!utils.checkReader(req, publication.reader)) {
          return next(
            boom.forbidden(`Access to publication ${id} disallowed`, {
              type: 'Publication',
              id,
              acitivity: 'Upload File to Publication'
            })
          )
        } else {
          let prefix =
            process.env.NODE_ENV === 'test' ? 'reader-test-' : 'reader-storage-'

          // one bucket per publication
          bucketName = prefix + req.params.id.toLowerCase()
          const publicationId = req.params.id

          let bucket
          try {
            await storage.createBucket(bucketName)
          } catch (err) {
            // 409 = bucket already created. Ignore this error.
            if (err.code !== 409) {
              return next(
                boom.failedDependency(err.message, {
                  service: 'google bucket',
                  activity: 'Upload File to Publication'
                })
              )
            }
          }
          bucket = storage.bucket(bucketName)

          if (!req.file) {
            return next(
              boom.badRequest('no file was included in this upload', {
                type: 'publication-file-upload',
                missingParams: ['req.file'],
                activity: 'Upload File to Publication'
              })
            )
          } else {
            let document = {
              documentPath: req.body.documentPath,
              mediaType: req.body.mediaType
            }
            if (req.body.json) {
              document.json = req.body.json
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
              return next(
                boom.failedDependency(err.message, {
                  service: 'google bucket',
                  activity: 'Upload File to Publication'
                })
              )
            })

            stream.on('finish', () => {
              blob
                .makePublic()
                .then(() => {
                  if (document.json) document.json = JSON.parse(document.json)
                  return Document.createDocument(
                    publication.reader,
                    publicationId,
                    document
                  )
                })
                .then(doc => {
                  if (
                    (document.mediaType === 'text/html' ||
                      document.mediaType === 'application/xhtml+xml') &&
                    elasticsearchQueue
                  ) {
                    elasticsearchQueue.add({
                      type: 'add',
                      fileName: file.name,
                      bucketName: bucketName,
                      document: doc,
                      pubId: id
                    })
                  }

                  res.setHeader('Content-Type', 'application/json;')
                  res.end(JSON.stringify(doc))
                })
                .catch(err => {
                  console.log(err)
                })
            })

            stream.end(req.file.buffer)
          }
        }
      })
    }
  )
}
