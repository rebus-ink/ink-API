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
const boom = require('@hapi/boom')
const _ = require('lodash')

const utils = require('../utils/utils')
/**
 * @swagger
 * definition:
 *   outbox-request:
 *     properties:
 *       type:
 *         type: string
 *         enum: ['Create', 'Add', 'Remove', 'Delete', 'Update', 'Read']
 *         required: true
 *       object:
 *         type: object
 *         properties:
 *           type:
 *             type: string
 *             enum: ['Publication', 'Note', 'reader:Tag']
 *         additionalProperties: true
 *       target:
 *         type: object
 *         properties:
 *           type:
 *             type: string
 *             enum: ['Publication', 'Note', 'reader:Tag']
 *         additionalProperties: true
 *       json:
 *         type: object
 *       '@context':
 *         type: array
 *         required: true
 *
 */
module.exports = function (app) {
  /**
   * @swagger
   * /reader-{id}/activity:
   *   post:
   *     tags:
   *       - readers
   *     description: POST /reader-:id/activity
   *     parameters:
   *       - in: path
   *         name: id
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
   *         description: Successfully completed the activity
   *       404:
   *         description: 'No Reader / Publication / Note with ID {id}'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router.route('/reader-:id/activity').post(jwtAuth, function (req, res, next) {
    const id = req.params.id
    Reader.byId(id)
      .then(reader => {
        if (!reader) {
          return next(
            boom.notFound(`No reader with ID ${id}`, { type: 'Reader', id })
          )
        } else if (!utils.checkReader(req, reader)) {
          return next(
            boom.forbidden(`Access to reader ${id} disallowed`, {
              type: 'Reader',
              id
            })
          )
        } else {
          if (!req.is('application/ld+json')) {
            return next(boom.badRequest('Body must be JSON-LD'))
          }

          const body = req.body
          if (typeof body !== 'object' || _.isEmpty(body)) {
            return next(boom.badRequest('Body must be a JSON object'))
          }

          const handleActivity = async () => {
            switch (body.type) {
              case 'Create':
                await handleCreate(req, res, reader)
                break

              case 'Add':
                await handleAdd(req, res, next, reader)
                break

              case 'Remove':
                await handleRemove(req, res, next, reader)
                break

              case 'Delete':
                await handleDelete(req, res, next, reader)
                break

              case 'Arrive':
                await handleArrive(req, res, reader)
                break

              case 'Update':
                await handleUpdate(req, res, reader)
                break

              case 'Read':
                await handleRead(req, res, next, reader)
                break

              default:
                return next(
                  boom.badRequest(`action ${body.type} not recognized`, {
                    badParams: ['body.type']
                  })
                )
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
