const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { handleCreate } = require('./activities/create')
const { handleAdd } = require('./activities/add')
const { handleRemove } = require('./activities/remove')
const { handleDelete } = require('./activities/delete')
const { handleArrive } = require('./activities/arrive')
const { handleUpdate } = require('./activities/update')
const { handleRead } = require('./activities/read')

const utils = require('./utils')
/**
 * @swagger
 * definition:
 *   outbox-request:
 *     properties:
 *       type:
 *         type: string
 *         enum: ['Create', 'Add', 'Remove', 'Delete', 'Update', 'Read']
 *       object:
 *         type: object
 *         properties:
 *           type:
 *             type: string
 *             enum: ['reader:Publication', 'Document', 'Note', 'reader:Tag']
 *         additionalProperties: true
 *       '@context':
 *         type: array
 *
 */
module.exports = function (app) {
  /**
   * @swagger
   * /reader-{shortId}/activity:
   *   post:
   *     tags:
   *       - readers
   *     description: POST /reader-:shortId/activity
   *     parameters:
   *       - in: path
   *         name: shortId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/outbox-request'
   *     responses:
   *       201:
   *         description: Created
   *       204:
   *         description: Successfully added or removed a tag, or successfully deleted
   *       404:
   *         description: 'No Reader / Publication / Note with ID {shortId}'
   *       403:
   *         description: 'Access to reader {shortId} disallowed'
   */
  app.use('/', router)
  router
    .route('/reader-:shortId/activity')
    .post(jwtAuth, function (req, res, next) {
      const shortId = req.params.shortId
      Reader.byShortId(shortId)
        .then(reader => {
          if (!reader) {
            res.status(404).send(`No reader with ID ${shortId}`)
          } else if (!utils.checkReader(req, reader)) {
            res.status(403).send(`Access to reader ${shortId} disallowed`)
          } else {
            if (!req.is('application/ld+json')) {
              return next(new Error('Body must be JSON-LD'))
            }

            const body = req.body
            if (typeof body !== 'object') {
              return next(new Error('Body must be a JSON object'))
            }

            const handleActivity = async () => {
              switch (body.type) {
                case 'Create':
                  await handleCreate(req, res, reader)
                  break

                case 'Add':
                  await handleAdd(req, res, reader)
                  break

                case 'Remove':
                  await handleRemove(req, res, reader)
                  break

                case 'Delete':
                  await handleDelete(req, res, reader)
                  break

                case 'Arrive':
                  await handleArrive(req, res, reader)
                  break

                case 'Update':
                  await handleUpdate(req, res, reader)
                  break

                case 'Read':
                  await handleRead(req, res, reader)
                  break

                default:
                  res.status(400).send(`action ${body.type} not reconized`)
              }
            }
            return handleActivity()
          }
        })
        .catch(err => {
          next(err)
        })
    })
}
