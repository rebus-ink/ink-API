const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Document } = require('../models/Document')
const debug = require('debug')('hobb:routes:document')

router.get(
  '/document-:shortId',
  passport.authenticate('jwt', { session: false }),
  function (req, res, next) {
    const shortId = req.params.shortId
    Document.byShortId(shortId)
      .then(document => {
        if (!document) {
          res.status(404).send(`No document with ID ${shortId}`)
        } else if (`auth0|${req.user}` !== document.reader.userId) {
          res.status(403).send(`Access to document ${shortId} disallowed`)
        } else {
          debug(document)
          res.setHeader(
            'Content-Type',
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
          res.end(
            JSON.stringify(
              Object.assign(document.toJSON(), {
                '@context': [
                  'https://www.w3.org/ns/activitystreams',
                  { reader: 'https://rebus.foundation/ns/reader' }
                ]
              })
            )
          )
        }
      })
      .catch(next)
  }
)

module.exports = router
