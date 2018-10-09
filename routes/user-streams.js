const express = require('express')
const router = express.Router()

router.get('/:nickname/streams', function (req, res, next) {
  const nickname = req.params.nickname
  const host = req.headers.host

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
})

module.exports = router
