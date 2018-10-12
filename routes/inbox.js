const express = require('express')
const router = express.Router()

router.route('/:nickname/inbox').get(function (req, res, next) {
  const nickname = req.params.nickname
  const host = req.headers.host

  res.setHeader(
    'Content-Type',
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  res.end(
    JSON.stringify({
      '@context': 'https://www.w3.org/ns/activitystreams',
      name: `Inbox for ${nickname}`,
      type: 'OrderedCollection',
      id: `https://${host}/${nickname}/inbox`,
      totalItems: 0,
      orderedItems: []
    })
  )
})

module.exports = router
