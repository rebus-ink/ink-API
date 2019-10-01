const express = require('express')
const router = express.Router()
const multer = require('multer')
const { Storage } = require('@google-cloud/storage')
const passport = require('passport')
const crypto = require('crypto')
const boom = require('@hapi/boom')
const { Job } = require('../models/Job')

const storage = new Storage()

const m = multer({ storage: multer.memoryStorage() })
/**
 * @swagger
 * /reader-:id/file-upload-pub:
 *   post:
 *     tags:
 *       - publications
 *     description: POST /reader-:id/file-upload-pub
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
 *       403:
 *         description: Access to publication {id} disallowed
 */
module.exports = app => {
  app.use('/', router)
  router.post(
    '/reader-:id/file-upload-pub',
    passport.authenticate('jwt', { session: false }),
    m.single('file'),
    async function (req, res, next) {
      let bucketName = 'publication-file-uploads'
      let bucket = storage.bucket(bucketName)
      let file = req.file
      if (!req.file) {
        return next(
          boom.badRequest('no file was included in this upload', {
            type: 'publication-file-upload',
            missingParams: ['req.file'],
            activity: 'Upload File to Publication'
          })
        )
      } else {
        // check extension
        const extension = file.originalname.split('.').pop()
        const randomName = `${crypto
          .randomBytes(15)
          .toString('hex')}.${extension}`
        file.name = `reader-${req.params.id}/${randomName}`

        // for now, only accept epub
        if (extension !== 'epub') {
          return next(
            boom.badRequest('file format not accepted', {
              type: 'publication-file-upload: only epub accepted',
              badParams: ['req.file'],
              activity: 'Upload File to Publication'
            })
          )
        }

        // upload
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
              return Job.createJob({
                type: 'epub',
                readerId: req.params.id
              })
            })
            .then(job => {
              // TODO: figure out what to do with elasticsearch
              // if (
              //   (document.mediaType === 'text/html' ||
              //     document.mediaType === 'application/xhtml+xml') &&
              //   elasticsearchQueue
              // ) {
              //   elasticsearchQueue.add({
              //     type: 'add',
              //     fileName: file.name,
              //     bucketName: bucketName,
              //     document: doc,
              //     pubId: id
              //   })
              // }

              res.setHeader('Content-Type', 'application/json;')
              res.end(JSON.stringify(job))
            })
            .catch(err => {
              console.log(err)
            })
        })

        stream.end(req.file.buffer)
      }
    }
  )
}
