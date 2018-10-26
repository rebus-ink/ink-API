const express = require('express')
const router = express.Router()
const passport = require('passport')
const { getId } = require('../utils/get-id.js')

router
  .route('/:nickname/inbox')
  .get(passport.authenticate('jwt', { session: false }), function (
    req,
    res,
    next
  ) {
    const nickname = req.params.nickname

    if (req.user !== nickname) {
      res.status(403).send(`Access to inbox for ${nickname} disallowed`)
      return
    }

    res.setHeader(
      'Content-Type',
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

    res.end(
      JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        name: `Inbox for ${nickname}`,
        type: 'OrderedCollection',
        id: getId(`/${nickname}/inbox`),
        totalItems: 0,
        orderedItems: []
      })
    )
  })

module.exports = router
