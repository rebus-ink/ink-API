const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Note } = require('../models/Note')
const { NoteContext } = require('../models/NoteContext')
const debug = require('debug')('hobb:routes:document')
const utils = require('../utils/utils')
const boom = require('@hapi/boom')

module.exports = app => {
  app.use('/', router)

  /**
   * @swagger
   * /noteContexts/{id}:
   *   get:
   *     tags:
   *       - noteContexts
   *     description: GET /noteContexts/:id
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: the short id of the noteContext
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A NoteContext Object with a list of notes and noteRelations
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/noteContext'
   *       401:
   *         desription: 'No Authentication'
   *       403:
   *         description: 'Access to NoteContext {id} disallowed'
   *       404:
   *         description: 'No NoteContext with ID {id}'
   */

  router.get(
    '/noteContexts/:id',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      NoteContext.byId(id)
        .then(noteContext => {
          if (!noteContext || noteContext.deleted) {
            return next(
              boom.notFound(
                `Get NoteContext Error: No NoteContext found with id ${id}`,
                {
                  requestUrl: req.originalUrl
                }
              )
            )
          } else if (!utils.checkReader(req, noteContext.reader)) {
            return next(
              boom.forbidden(`Access to NoteContext ${id} disallowed`, {
                requestUrl: req.originalUrl
              })
            )
          } else {
            res.setHeader('Content-Type', 'application/ld+json')
            res.end(JSON.stringify(noteContext.toJSON()))
          }
        })
        .catch(err => {
          console.log(err)
          next(err)
        })
    }
  )
}
