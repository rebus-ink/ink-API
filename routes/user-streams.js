const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const NoSuchReaderError = require('../errors/no-such-reader')
const debug = require('debug')('hobb:routes:user-streams')
const { getId } = require('../utils/get-id.js')

router.get(
  '/reader-:shortId/streams',
  passport.authenticate('jwt', { session: false }),
  function (req, res, next) {
    const shortId = req.params.shortId
    Reader.byShortId(shortId)
      .then(reader => {
        debug(reader)
        debug(req.user)
        if (`auth0|${req.user}` !== reader.userId) {
          res.status(403).send(`Access to reader ${shortId} disallowed`)
        } else {
          res.setHeader(
            'Content-Type',
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
          res.end(
            JSON.stringify({
              '@context': 'https://www.w3.org/ns/activitystreams',
              summaryMap: {
                en: `Streams for user with id ${shortId}`
              },
              type: 'Collection',
              id: getId(`/reader-${shortId}/streams`),
              totalItems: 1,
              items: [
                {
                  type: 'Collection',
                  id: getId(`/reader-${shortId}/library`),
                  summaryMap: {
                    en: `Library for user with id ${shortId}`
                  }
                }
              ]
            })
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
