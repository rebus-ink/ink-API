const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const NoSuchReaderError = require('../errors/no-such-reader')
const utils = require('./utils')

module.exports = app => {
  app.use('/', router)
  router.get(
    '/reader-:shortId',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      Reader.byShortId(req.params.shortId)
        .then(reader => {
          if (!reader) {
            res.status(404).send('no such user') // TODO: fix error message
          } else if (!utils.checkReader(req, reader)) {
            res
              .status(403)
              .send(`Access to reader ${req.params.shortId} disallowed`)
          } else {
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
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
          if (err instanceof NoSuchReaderError) {
            res.status(404).send(err.message)
          } else {
            next(err)
          }
        })
    }
  )
}
