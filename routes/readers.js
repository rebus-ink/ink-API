const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const debug = require('debug')('hobb:routes:readers')
const boom = require('@hapi/boom')

const insertNewReader = (readerId, person, next) => {
  debug(`Inserting new reader for user ID ${readerId}`)
  return new Promise((resolve, reject) => {
    debug(`Querying for reader with ID ${readerId}`)
    Reader.checkIfExistsByAuthId(readerId)
      .then(response => {
        if (response) {
          return next(
            boom.badRequest(`reader already exists with id ${readerId}`, {
              type: 'Reader',
              id: readerId
            })
          )
        } else {
          return Reader.createReader(readerId, person)
        }
      })
      .then(resolve)
  })
}

/**
 * @swagger
 * definition:
 *   readers-request:
 *     properties:
 *       name:
 *         type: string
 *         required: true
 *       '@context':
 *         type: array
 *         required: true
 *       profile:
 *         type: object
 *       preferences:
 *         type: object,
 *       json:
 *         type: object
 *
 */

module.exports = function (app) {
  /**
   * @swagger
   * /readers:
   *   post:
   *     tags:
   *       - readers
   *     description: POST /readers
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/readers-request'
   *     responses:
   *       201:
   *         description: Created
   *       400:
   *         description: 'Reader already exists'
   */
  app.use('/', router)
  router.post(
    '/readers',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      insertNewReader(req.user, req.body, next)
        .then(reader => {
          debug(`Got reader ${JSON.stringify(reader)}`)
          res.setHeader(
            'Content-Type',
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
          debug(`Setting location to ${reader.id}`)
          res.setHeader('Location', reader.id)
          res.sendStatus(201)
          res.end()
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
