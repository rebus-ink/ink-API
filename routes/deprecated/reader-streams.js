const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const debug = require('debug')('hobb:routes:reader-streams')
const { getId } = require('../../utils/get-id.js')
const boom = require('@hapi/boom')

const utils = require('../../utils/utils')

module.exports = app => {
  app.use('/', router)
  router.get(
    '/reader-:id/streams',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      Reader.byId(id)
        .then(reader => {
          debug(reader)
          debug(req.user)
          if (!reader) {
            return next(
              boom.notFound(`No reader with ID ${id}`, {
                type: 'Reader',
                id,
                activity: 'Get Streams'
              })
            )
          } else if (!utils.checkReader(req, reader)) {
            return next(
              boom.forbidden(`Access to reader ${id} disallowed`, {
                type: 'Reader',
                id,
                activity: 'Get Streams'
              })
            )
          } else {
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
            res.end(
              JSON.stringify({
                '@context': 'https://www.w3.org/ns/activitystreams',
                summaryMap: {
                  en: `Streams for reader with id ${id}`
                },
                type: 'Collection',
                id: getId(`/reader-${id}/streams`),
                totalItems: 1,
                items: [
                  {
                    type: 'Collection',
                    id: getId(`/reader-${id}/library`),
                    summaryMap: {
                      en: `Library for reader with id ${id}`
                    }
                  }
                ]
              })
            )
          }
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
