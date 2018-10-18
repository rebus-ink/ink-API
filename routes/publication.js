const express = require('express')
const router = express.Router()
const passport = require('passport')

router.get(
  '/:nickname/publication/:pubid',
  passport.authenticate('jwt', { session: false }),
  function (req, res, next) {
    const nickname = req.params.nickname
    const pubid = req.params.pubid
    const host = req.headers.host

    if (req.user !== nickname) {
      res.status(403).send(`Access to document ${pubid} disallowed`)
      return
    }

    res.setHeader(
      'Content-Type',
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

    res.end(
      JSON.stringify({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          { reader: 'https://rebus.foundation/ns/reader' }
        ],
        type: 'reader:Publication',
        id: `https://${host}/${nickname}/publication/${pubid}`,
        name: `Publication ${pubid}`,
        attributedTo: {
          type: 'Person',
          name: 'Sample Author'
        },
        totalItems: 4,
        orderedItems: [
          {
            type: 'Document',
            id: `https://${host}/${nickname}/publication/${pubid}/document/1`,
            name: 'Chapter 1'
          },
          {
            type: 'Document',
            id: `https://${host}/${nickname}/publication/${pubid}/document/2`,
            name: 'Chapter 2'
          },
          {
            type: 'Document',
            id: `https://${host}/${nickname}/publication/${pubid}/document/3`,
            name: 'Chapter 3'
          },
          {
            type: 'Document',
            id: `https://${host}/${nickname}/publication/${pubid}/document/4`,
            name: 'Chapter 4'
          }
        ]
      })
    )
  }
)

module.exports = router
