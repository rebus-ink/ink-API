const express = require('express')
const router = express.Router()

router.get('/:nickname/activity', function (req, res, next) {
  const nickname = req.params.nickname
  const host = req.headers.host

  res.setHeader(
    'Content-Type',
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  res.end(
    JSON.stringify({
      '@context': 'https://www.w3.org/ns/activitystreams',
      name: `Activities by ${nickname}`,
      type: 'OrderedCollection',
      id: `https://${host}/${nickname}/activity`,
      orderedItems: []
    })
  )
})

module.exports = router
