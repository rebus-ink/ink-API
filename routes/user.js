const express = require('express')
const router = express.Router()
const passport = require('passport')

router.get(
  '/:nickname',
  passport.authenticate('jwt', { session: false }),
  function (req, res, next) {
    const nickname = req.params.nickname
    const host = req.headers.host

    if (req.user !== nickname) {
      res.status(403).send(`Access to user ${nickname} disallowed`)
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
        name: nickname,
        type: 'Person',
        id: `https://${host}/${nickname}`,
        inbox: `https://${host}/${nickname}/inbox`,
        outbox: `https://${host}/${nickname}/activity`,
        streams: {
          id: `https://${host}/${nickname}/streams`,
          type: 'Collection',
          summaryMap: {
            en: `Collections for user ${nickname}`
          },
          totalItems: 1,
          items: [
            {
              summaryMap: {
                en: `Library for user ${nickname}`
              },
              id: `https://${host}/${nickname}/library`,
              type: 'Collection',
              totalItems: 6
            }
          ]
        }
      })
    )
  }
)

module.exports = router
