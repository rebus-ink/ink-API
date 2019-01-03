const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const debug = require('debug')('hobb:routes:whoami')
const NoSuchReaderError = require('../errors/no-such-reader')

module.exports = app => {
  /**
   * @swagger
   * /whoami:
   *   get:
   *     tags:
   *       - readers
   *     description: GET /whoami
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: The reader object for the reader currently logged in
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/reader'
   *       404:
   *         description: 'No Reader with ID {shortId}'
   */
  app.use('/', router)
  router.get(
    '/whoami',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      Reader.byUserId(req.user)
        .then(reader => {
          if (!reader) {
            res.status(404).send(`No reader with ID ${req.user}`)
          } else {
            debug(`Got reader ${JSON.stringify(reader)}`)
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
            debug(`Setting location to ${reader.url}`)
            res.setHeader('Location', reader.url)
            res.end(
              JSON.stringify(
                Object.assign(
                  {
                    '@context': [
                      'https://www.w3.org/ns/activitystreams',
                      { reader: 'https://rebus.foundation/ns/reader' }
                    ]
                  },
                  reader.toJSON()
                )
              )
            )
          }
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
