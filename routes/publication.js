const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Publication } = require('../models/Publication')
const debug = require('debug')('hobb:routes:publication')
const utils = require('./utils')

module.exports = function (app) {
  app.use('/', router)
  router.get(
    '/publication-:shortId',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const shortId = req.params.shortId
      Publication.byShortId(shortId)
        .then(publication => {
          if (!publication) {
            res.status(404).send(`No publication with ID ${shortId}`)
          } else if (!utils.checkReader(req, publication.reader)) {
            res.status(403).send(`Access to publication ${shortId} disallowed`)
          } else {
            debug(publication)
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
            const publicationJson = publication.toJSON()
            res.end(
              JSON.stringify(
                Object.assign(publicationJson, {
                  orderedItems: publicationJson.orderedItems.map(doc =>
                    doc.asRef()
                  ),
                  attachment: publication.attachment.map(doc => doc.asRef()),
                  '@context': [
                    'https://www.w3.org/ns/activitystreams',
                    { reader: 'https://rebus.foundation/ns/reader' },
                    { schema: 'https://schema.org/' }
                  ]
                })
              )
            )
          }
        })
        .catch(next)
    }
  )
}
