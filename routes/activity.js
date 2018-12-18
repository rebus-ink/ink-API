const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Activity } = require('../models/Activity')
const debug = require('debug')('hobb:routes:activity')
// app.use('/', require('./routes/activity'))
const utils = require('./utils')

module.exports = function (app) {
  app.use('/', router)

  router.get(
    '/activity-:shortId',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const shortId = req.params.shortId
      Activity.byShortId(shortId)
        .then(activity => {
          if (!activity) {
            res.status(404).send(`No activity with ID ${shortId}`)
          } else if (!utils.checkReader(req, activity.reader)) {
            res.status(403).send(`Access to activity ${shortId} disallowed`)
          } else {
            debug(activity)
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
            res.end(
              JSON.stringify(
                Object.assign(activity.toJSON(), {
                  '@context': [
                    'https://www.w3.org/ns/activitystreams',
                    { reader: 'https://rebus.foundation/ns/reader' }
                  ]
                })
              )
            )
          }
        })
        .catch(next)
    }
  )
}
