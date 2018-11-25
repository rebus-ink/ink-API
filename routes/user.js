const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const NoSuchReaderError = require('../errors/no-such-reader')
const debug = require('debug')('hobb:routes:user')

router.get(
  '/reader-:shortId',
  passport.authenticate('jwt', { session: false }),
  function (req, res, next) {
    Reader.byShortId(req.params.shortId)
      .then(reader => {
        debug(reader)
        debug(req.user)
        if (`auth0|${req.user}` !== reader.userId) {
          res.status(403).send(`Access to reader ${req.params.id} disallowed`)
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

module.exports = router
