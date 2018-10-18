const express = require('express')
const router = express.Router()
const passport = require('passport')

router.get(
  '/:nickname/streams',
  passport.authenticate('jwt', { session: false }),
  function (req, res, next) {
    const nickname = req.params.nickname
    const host = req.headers.host

    if (req.user !== nickname) {
      res.status(403).end(`Access to streams for ${nickname} disallowed`)
      return
    }

    res.setHeader(
      'Content-Type',
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

    res.end(
      JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        name: `${nickname} streams`,
        type: 'Collection',
        id: `https://${host}/${nickname}/streams`,
        totalItems: 1,
        items: [
          {
            type: 'Collection',
            id: `https://${host}/${nickname}/library`,
            name: `${nickname}'s library`
          }
        ]
      })
    )
  }
)

module.exports = router
