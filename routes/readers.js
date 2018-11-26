const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const debug = require('debug')('hobb:routes:readers')
const _ = require('lodash')

const personAttrs = [
  'attachment',
  'attributedTo',
  'audience',
  'content',
  'context',
  'contentMap',
  'name',
  'nameMap',
  'endTime',
  'generator',
  'icon',
  'image',
  'inReplyTo',
  'location',
  'preview',
  'published',
  'replies',
  'startTime',
  'summary',
  'summaryMap',
  'tag',
  'updated',
  'url',
  'to',
  'bto',
  'cc',
  'bcc',
  'mediaType',
  'duration'
]

class ReaderExistsError extends Error {
  constructor (userId) {
    super(`Reader already exists for user ${userId}`)
  }
}

const insertNewReader = (userId, person) => {
  debug(`Inserting new reader for user ID ${userId}`)
  return new Promise((resolve, reject) => {
    debug(`Querying for user with ID ${userId}`)
    Reader.query(Reader.knex())
      .where('userId', '=', `auth0|${userId}`)
      .then(readers => {
        debug(
          `Got results for user with ID ${userId}: ${JSON.stringify(readers)}`
        )
        if (readers.length > 0) {
          debug('Reader exists; rejecting')
          reject(new ReaderExistsError(userId))
        } else {
          debug('Creating new reader')
          let props = _.pick(person, personAttrs)
          props.userId = `auth0|${userId}`
          debug('Inserting reader')
          Reader.query(Reader.knex())
            .insertAndFetch(props)
            .then(resolve)
            .catch(reject)
        }
      })
      .catch(reject)
  })
}

router.post(
  '/readers',
  passport.authenticate('jwt', { session: false }),
  function (req, res, next) {
    insertNewReader(req.user, req.body)
      .then(reader => {
        debug(`Got reader ${JSON.stringify(reader)}`)
        res.setHeader(
          'Content-Type',
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
        debug(`Setting location to ${reader.url}`)
        res.setHeader('Location', reader.url)
        res.sendStatus(201)
        res.end()
      })
      .catch(err => {
        if (err instanceof ReaderExistsError) {
          res.status(400).send(err.message)
        } else {
          next(err)
        }
      })
  }
)

module.exports = router
