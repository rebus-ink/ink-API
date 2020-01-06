const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Note } = require('../../models/Note')
const debug = require('debug')('hobb:routes:document')
const utils = require('../../utils/utils')
const boom = require('@hapi/boom')

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
 *       noteType:
 *         type: string
 *       'oa:hasSelector':
 *         type: object
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
 *       inReplyTo:
 *         type: string
 *         format: url
 *         description: The url of the document
 *       context:
 *         type: string
 *         format: url
 *         description: The url of the publication
 *       json:
 *         type: object
 *
 */

module.exports = app => {
  app.use('/', router)

  /**
   * @swagger
   * /note-{id}:
   *   get:
   *     tags:
   *       - notes
   *     description: GET /note-:id
   *     parameters:
   *       - in: path
   *         name: id
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
   *         description: 'No Note with ID {id}'
   *       403:
   *         description: 'Access to note {id} disallowed'
   */

  router.get(
    '/note-:id',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      Note.byId(id)
        .then(note => {
          if (!note || note.deleted) {
            return next(
              boom.notFound(`No note with ID ${id}`, {
                type: 'Note',
                id,
                activity: 'Get Note'
              })
            )
          } else if (!utils.checkReader(req, note.reader)) {
            return next(
              boom.forbidden(`Access to note ${id} disallowed`, {
                type: 'Note',
                id,
                activity: 'Get Note'
              })
            )
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
