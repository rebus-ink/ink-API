const express = require('express')
const router = express.Router()

router.get('/:nickname', function (req, res, next) {
  const nickname = req.params.nickname
  const host = req.headers.host

  res.setHeader(
    'Content-Type',
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  res.end(
    JSON.stringify({
      '@context': 'https://www.w3.org/ns/activitystreams',
      name: nickname,
      type: 'Person',
      id: `https://${host}/${nickname}`,
      inbox: `https://${host}/${nickname}/inbox`,
      outbox: `https://${host}/${nickname}/activity`,
      liked: `https://${host}/${nickname}/liked`,
      streams: `https://${host}/${nickname}/streams`
    })
  )
})

module.exports = router
