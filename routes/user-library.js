const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const NoSuchReaderError = require('../errors/no-such-reader')
const { getId } = require('../utils/get-id.js')
const utils = require('./utils')

module.exports = app => {
  app.use('/', router)
  router.get(
    '/reader-:shortId/library',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const shortId = req.params.shortId
      Reader.byShortId(shortId, ['publications'])
        .then(reader => {
          if (!utils.checkReader(req, reader)) {
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
                id: getId(`/reader-${shortId}/library`),
                totalItems: reader.publications.length,
                items: reader.publications.map(pub => pub.asRef())
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
}
