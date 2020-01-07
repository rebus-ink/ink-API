const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const utils = require('../utils/utils')
const boom = require('@hapi/boom')

/**
 * @swagger
 * definition:
 *   reader:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *         enum: ['Person']
 *       summaryMap:
 *         type: object
 *         properties:
 *           en:
 *             type: string
 *       '@context':
 *         type: array
 *       inbox:
 *         type: string
 *         format: url
 *       outbox:
 *         type: string
 *         format: url
 *       name:
 *         type: string
 *       profile:
 *         type: object
 *       preferences:
 *         type: object
 *       json:
 *         type: object
 *       published:
 *         type: string
 *         format: date-time
 *       updated:
 *         type: string
 *         format: date-time
 */
module.exports = app => {
  /**
   * @swagger
   * /readers/{id}:
   *   get:
   *     tags:
   *       - readers
   *     description: GET /readers/:id
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: the id of the reader
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A reader object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/reader'
   *       404:
   *         description: 'No Reader with ID {id}'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router.get(
    '/readers/:id',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      Reader.byId(req.params.id)
        .then(reader => {
          if (!reader) {
            return next(
              boom.notFound(`No reader with ID ${req.params.id}`, {
                type: 'Reader',
                id: req.params.id,
                activity: 'Get Reader'
              })
            )
          } else if (!utils.checkReader(req, reader)) {
            return next(
              boom.forbidden(`Access to reader ${req.params.id} disallowed`, {
                type: 'Reader',
                id: req.params.id,
                activity: 'Get Reader'
              })
            )
          } else {
            res.setHeader('Content-Type', 'application/ld+json')
            res.end(JSON.stringify(reader.toJSON()))
          }
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
