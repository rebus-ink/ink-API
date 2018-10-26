const express = require('express')
const router = express.Router()
const passport = require('passport')
const { getId } = require('../utils/get-id.js')

router.get(
  '/:nickname/library',
  passport.authenticate('jwt', { session: false }),
  function (req, res, next) {
    const nickname = req.params.nickname

    if (req.user !== nickname) {
      res.status(403).send(`Access to library for ${nickname} disallowed`)
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
        name: `${nickname} library`,
        type: 'Collection',
        id: getId(`/${nickname}/library`),
        totalItems: 6,
        items: [
          {
            type: 'reader:Publication',
            id: getId(`/${nickname}/publication/1`),
            name: 'Publication 1',
            attributedTo: {
              type: 'Person',
              name: 'Sample Author 1'
            }
          },
          {
            type: 'reader:Publication',
            id: getId(`/${nickname}/publication/2`),
            name: 'Publication 2',
            attributedTo: {
              type: 'Person',
              name: 'Sample Author 2'
            }
          },
          {
            type: 'reader:Publication',
            id: getId(`/${nickname}/publication/3`),
            name: 'Publication 3',
            attributedTo: {
              type: 'Person',
              name: 'Sample Author 3'
            }
          },
          {
            type: 'reader:Publication',
            id: getId(`/${nickname}/publication/4`),
            name: 'Publication 4',
            attributedTo: {
              type: 'Person',
              name: 'Sample Author 4'
            }
          },
          {
            type: 'reader:Publication',
            id: getId(`/${nickname}/publication/5`),
            name: 'Publication 5',
            attributedTo: {
              type: 'Person',
              name: 'Sample Author 5'
            }
          },
          {
            type: 'reader:Publication',
            id: getId(`/${nickname}/publication/6`),
            name: 'Publication 6',
            attributedTo: {
              type: 'Person',
              name: 'Sample Author 6'
            }
          }
        ]
      })
    )
  }
)

module.exports = router
