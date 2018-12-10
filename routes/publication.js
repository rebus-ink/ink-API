const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Publication } = require('../models/Publication')
const debug = require('debug')('hobb:routes:publication')

router.get(
  '/publication-:shortId',
  passport.authenticate('jwt', { session: false }),
  function (req, res, next) {
    const shortId = req.params.shortId
    Publication.byShortId(shortId)
      .then(publication => {
        if (!publication) {
          res.status(404).send(`No publication with ID ${shortId}`)
        } else if (`auth0|${req.user}` !== publication.reader.userId) {
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
                orderedItems: publicationJson.orderedItems
                  ? publicationJson.orderedItems.map(doc => doc.asRef())
                  : null,
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

module.exports = router
