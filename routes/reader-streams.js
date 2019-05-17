const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const debug = require('debug')('hobb:routes:reader-streams')
const { getId } = require('../utils/get-id.js')

const utils = require('../utils/utils')

module.exports = app => {
  app.use('/', router)
  router.get(
    '/reader-:shortId/streams',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const shortId = req.params.shortId
      Reader.byId(shortId)
        .then(reader => {
          debug(reader)
          debug(req.user)
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
                  en: `Streams for reader with id ${shortId}`
                },
                type: 'Collection',
                id: getId(`/reader-${shortId}/streams`),
                totalItems: 1,
                items: [
                  {
                    type: 'Collection',
                    id: getId(`/reader-${shortId}/library`),
                    summaryMap: {
                      en: `Library for reader with id ${shortId}`
                    }
                  }
                ]
              })
            )
          }
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
