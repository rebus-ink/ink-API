const express = require('express')
const router = express.Router()

router.get('/:nickname/library', function (req, res, next) {
  const nickname = req.params.nickname
  const host = req.headers.host

  res.setHeader(
    'Content-Type',
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  res.end(
    JSON.stringify({
      '@context': 'https://www.w3.org/ns/activitystreams',
      name: `${nickname} library`,
      type: 'Collection',
      id: `https://${host}/${nickname}/library`,
      totalItems: 0,
      items: []
    })
  )
})

module.exports = router
