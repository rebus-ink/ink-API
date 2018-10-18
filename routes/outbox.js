const express = require('express')
const router = express.Router()
const passport = require('passport')

router
  .route('/:nickname/activity')
  .get(passport.authenticate('jwt', { session: false }), function (
    req,
    res,
    next
  ) {
    const nickname = req.params.nickname
    const host = req.headers.host

    if (req.user !== nickname) {
      res.status(403).send(`Access to outbox for ${nickname} disallowed`)
      return
    }

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
  .post(passport.authenticate('jwt', { session: false }), function (
    req,
    res,
    next
  ) {
    const nickname = req.params.nickname
    const host = req.headers.host

    if (req.user !== nickname) {
      res.status(403).send(`Access to user ${nickname} disallowed`)
      return
    }

    if (!req.is('application/ld+json')) {
      return next(new Error('Body must be JSON-LD'))
    }

    const body = req.body

    if (typeof body !== 'object') {
      return next(new Error('Body must be a JSON object'))
    }

    const type = body.type

    res.setHeader(
      'Location',
      `https://${host}/${nickname}/activity/${type.toLowerCase()}42`
    )
    res.sendStatus(201)
    res.end()
  })

module.exports = router
