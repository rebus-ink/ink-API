const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const debug = require('debug')('hobb:routes:whoami')
const NoSuchReaderError = require('../errors/no-such-reader')

module.exports = app => {
  app.use('/', router)
  router.get(
    '/whoami',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      Reader.byUserId(req.user)
        .then(reader => {
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
        })
        .catch(err => {
          if (err instanceof NoSuchReaderError) {
            res.status(404).send(err.message)
          } else {
            next(err)
          }
        })
    }
  )
}
