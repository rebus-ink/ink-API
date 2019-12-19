const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const { getId } = require('../../utils/get-id.js')
const utils = require('../../utils/utils')

module.exports = function (app) {
  app.use('/', router)
  router.get(
    '/reader-:shortId/inbox',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const shortId = req.params.shortId
      Reader.byShortId(shortId)
        .then(reader => {
          if (!reader) {
            res.status(404).send(`No reader with ID ${shortId}`)
          } else if (!utils.checkReader(req, reader)) {
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
                  en: `Inbox for reader ${shortId}`
                },
                type: 'OrderedCollection',
                id: getId(`/reader-${shortId}/inbox`),
                totalItems: 0,
                orderedItems: []
              })
            )
          }
        })
        .catch(err => {
          return next(err)
        })
    }
  )
}
