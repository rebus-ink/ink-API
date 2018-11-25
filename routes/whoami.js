const assert = require('assert')
const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const debug = require('debug')('hobb:routes:whoami')

class NoSuchReaderError extends Error {
  constructor (userId) {
    super(`No reader for user ${userId}`)
  }
}

const getReader = userId => {
  debug(`Getting reader for user ID ${userId}`)
  return new Promise((resolve, reject) => {
    debug(`Querying for user with ID ${userId}`)
    Reader.query(Reader.knex())
      .where('userId', '=', `auth0|${userId}`)
      .then(readers => {
        debug(
          `Got results for user with ID ${userId}: ${JSON.stringify(readers)}`
        )
        if (readers.length === 0) {
          reject(new NoSuchReaderError(userId))
        } else if (readers.length > 1) {
          reject(new Error(`Too many readers for user ${userId}`))
        } else {
          debug(`Just right! ${JSON.stringify(readers[0])}`)
          assert(readers.length === 1)
          resolve(readers[0])
        }
      })
      .catch(reject)
  })
}

router.get(
  '/whoami',
  passport.authenticate('jwt', { session: false }),
  function (req, res, next) {
    getReader(req.user)
      .then(reader => {
        debug(`Got reader ${JSON.stringify(reader)}`)
        res.setHeader(
          'Content-Type',
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
        debug(`Setting location to ${reader.url}`)
        res.setHeader('Location', reader.url)
        const results = {
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            { reader: 'https://rebus.foundation/ns/reader' }
          ],
          type: 'Person',
          summaryMap: {
            en: `User with id ${reader.id}`
          },
          id: reader.url,
          inbox: `${reader.url}/inbox`,
          outbox: `${reader.url}/activity`,
          streams: {
            id: `${reader.url}/streams`,
            type: 'Collection',
            summaryMap: {
              en: `Collections for user with id ${reader.id}`
            },
            totalItems: 1,
            items: [
              {
                summaryMap: {
                  en: `Library for user with id ${reader.id}`
                },
                id: `${reader.url}/library`,
                type: 'Collection'
              }
            ]
          },
          published: reader.published,
          updated: reader.updated
        }
        debug(`Returning JSON ${JSON.stringify(results)}`)
        res.end(JSON.stringify(results))
      })
      .catch(err => {
        if (err instanceof NoSuchReaderError) {
          res.status(404).send(err.message)
        } else {
          next(err)
        }
      })
  }
)

module.exports = router
