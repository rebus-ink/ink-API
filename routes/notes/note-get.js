const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Note } = require('../../models/Note')
const utils = require('../../utils/utils')
const boom = require('@hapi/boom')

module.exports = app => {
  app.use('/', router)

  /**
   * @swagger
   * /notes/{id}:
   *   get:
   *     tags:
   *       - notes
   *     description: GET /notes/:id
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
   *       401:
   *         desription: 'No Authentication'
   *       403:
   *         description: 'Access to note {id} disallowed'
   *       404:
   *         description: 'No Note with ID {id}'
   */

  router.get(
    '/notes/:id',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      Note.byId(id)
        .then(note => {
          if (!note || note.deleted) {
            return next(
              boom.notFound(`Get Note Error: No Note found with id ${id}`, {
                requestUrl: req.originalUrl
              })
            )
          } else if (!utils.checkReader(req, note.reader)) {
            return next(
              boom.forbidden(`Access to note ${id} disallowed`, {
                requestUrl: req.originalUrl
              })
            )
          } else {
            res.setHeader('Content-Type', 'application/ld+json')
            res.end(JSON.stringify(note.toJSON()))
          }
        })
        .catch(next)
    }
  )
}
