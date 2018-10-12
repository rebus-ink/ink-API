const express = require('express')
const router = express.Router()

router
  .route('/:nickname/activity')
  .get(function (req, res, next) {
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
  .post(function (req, res, next) {
    const nickname = req.params.nickname
    const host = req.headers.host

    const type = JSON.parse(req.body).type

    res.setHeader(
      'Location',
      `https://${host}/${nickname}/activity/${type.toLowerCase()}42`
    )
    res.sendStatus(201)
    res.end()
  })

module.exports = router
