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
      followers: `https://${host}/${nickname}/followers`,
      following: `https://${host}/${nickname}/following`,
      liked: `https://${host}/${nickname}/liked`
    })
  )
})

module.exports = router
