const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Note } = require('../models/Note')
const debug = require('debug')('hobb:routes:document')
const utils = require('./utils')

/**
 * @swagger
 * definition:
 *   note:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *         enum: ['Note']
         'oa:hasSelector':
            type: object
 *       content:
 *         type: string
 *       '@context':
 *         type: array
 *       published:
 *         type: string
 *         format: date-time
 *       updated:
 *         type: string
 *         format: date-time
 *
 */

module.exports = app => {
  app.use('/', router)

  /**
   * @swagger
   * /note-{shortId}:
   *   get:
   *     tags:
   *       - notes
   *     description: GET /note-:shortId
   *     parameters:
   *       - in: path
   *         name: shortId
   *         schema:
   *           type: string
   *         required: true
   *         description: the short id of the note
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A Note Object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/note'
   *       404:
   *         description: 'No Note with ID {shortId}'
   *       403:
   *         description: 'Access to note {shortId} disallowed'
   */

  router.get(
    '/note-:shortId',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const shortId = req.params.shortId
      Note.byShortId(shortId)
        .then(note => {
          if (!note) {
            res.status(404).send(`No note with ID ${shortId}`)
          } else if (!utils.checkReader(req, note.reader)) {
            res.status(403).send(`Access to note ${shortId} disallowed`)
          } else {
            debug(note)
            res.setHeader(
              'Content-Type',
              'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
            )
            res.end(
              JSON.stringify(
                Object.assign(note.toJSON(), {
                  '@context': [
                    'https://www.w3.org/ns/activitystreams',
                    { reader: 'https://rebus.foundation/ns/reader' }
                  ],
                  // not sure why context disapears when .toJSON is run. Giving it a different name is a quick fix.
                  context: note.json.pubcontext,
                  pubcontext: undefined
                })
              )
            )
          }
        })
        .catch(next)
    }
  )
}
