const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const NoSuchReaderError = require('../errors/no-such-reader')
const { getId } = require('../utils/get-id.js')
const debug = require('debug')('hobb:routes:outbox')
const jwtAuth = passport.authenticate('jwt', { session: false })
const _ = require('lodash')

const utils = require('./utils')

module.exports = function (app) {
  app.use('/', router)
  router
    .route('/reader-:shortId/activity')
    .get(jwtAuth, function (req, res, next) {
      const shortId = req.params.shortId
      Reader.byShortId(shortId, ['outbox'])
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
                  en: `Outbox for user with id ${shortId}`
                },
                type: 'OrderedCollection',
                id: getId(`/reader-${shortId}/activity`),
                totalItems: reader.outbox.length,
                orderedItems: reader.outbox.map(item => item.toJSON())
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
    })
}
