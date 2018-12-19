const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const { Activity } = require('../models/Activity')
const NoSuchReaderError = require('../errors/no-such-reader')
const { getId } = require('../utils/get-id.js')
const debug = require('debug')('hobb:routes:outbox')
const jwtAuth = passport.authenticate('jwt', { session: false })
const _ = require('lodash')

const utils = require('./utils')

module.exports = function (app) {
  app.use('/', router)
  router
    .route('/reader-:shortId/activity')
    .get(jwtAuth, function (req, res, next) {
      const shortId = req.params.shortId
      Reader.byShortId(shortId, ['outbox'])
        .then(reader => {
          if (!utils.checkReader(req, reader)) {
            res.status(403).send(`Access to reader ${shortId} disallowed`)
          } else {
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
            res.end(
              JSON.stringify({
                '@context': 'https://www.w3.org/ns/activitystreams',
                summaryMap: {
                  en: `Outbox for user with id ${shortId}`
                },
                type: 'OrderedCollection',
                id: getId(`/reader-${shortId}/activity`),
                totalItems: reader.outbox.length,
                orderedItems: reader.outbox.map(item => item.toJSON())
              })
            )
          }
        })
        .catch(err => {
          if (err instanceof NoSuchReaderError) {
            res.status(404).send(err.message)
          } else {
            next(err)
          }
        })
    })
    .post(jwtAuth, function (req, res, next) {
      const shortId = req.params.shortId
      Reader.byShortId(shortId)
        .then(reader => {
          if (`auth0|${req.user}` !== reader.userId) {
            res.status(403).send(`Access to reader ${shortId} disallowed`)
          } else {
            if (!req.is('application/ld+json')) {
              return next(new Error('Body must be JSON-LD'))
            }

            const body = req.body

            if (typeof body !== 'object') {
              return next(new Error('Body must be a JSON object'))
            }

            let pr
            if (body.type === 'Create') {
              switch (body.object.type) {
                case 'reader:Publication':
                  const related = {
                    bto: reader.url,
                    attachment: body.object.orderedItems
                  }
                  const graph = Object.assign(
                    related,
                    _.omit(body.object, ['orderedItems', 'totalItems'])
                  )
                  debug(graph)
                  pr = reader.$relatedQuery('publications').insertGraph(graph)
                  break
                case 'Document':
                  pr = reader.$relatedQuery('documents').insert(body.object)
                  break
                case 'Note':
                  pr = reader.$relatedQuery('replies').insert(body.object)
                  break
                default:
                  pr = Promise.resolve(null)
              }
            } else {
              pr = Promise.resolve(null)
            }
            pr
              .then(result => {
                debug(result)
                let props = Object.assign(body, {
                  actor: {
                    type: 'Person',
                    id: reader.url
                  }
                })
                if (result) {
                  props = Object.assign(props, {
                    object: {
                      type: result.json.type,
                      id: result.url
                    }
                  })
                }
                debug(props)
                Activity.query()
                  .insert(props)
                  .then(activity => {
                    res.status(201)
                    res.set('Location', activity.url)
                    res.end()
                  })
                  .catch(next)
              })
              .catch(next)
          }
        })
        .catch(err => {
          if (err instanceof NoSuchReaderError) {
            res.status(404).send(err.message)
          } else {
            next(err)
          }
        })
    })
}
