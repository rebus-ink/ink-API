const express = require('express')
const router = express.Router()
const passport = require('passport')
const { NoteContext } = require('../../models/NoteContext')
const utils = require('../../utils/utils')
const { notesListToTree } = require('../../utils/outline')
const boom = require('@hapi/boom')
const debug = require('debug')('ink:routes:outline-get')

module.exports = app => {
  app.use('/', router)

  /**
   * @swagger
   * /outlines/{id}:
   *   get:
   *     tags:
   *       - outlines
   *     description: GET /outlines/:id
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: the short id of the outline
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A outline Object with a list of notes and noteRelations
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/outline'
   *       401:
   *         desription: 'No Authentication'
   *       403:
   *         description: 'Access to outline {id} disallowed'
   *       404:
   *         description: 'No outline with ID {id}'
   */

  router.get(
    '/outlines/:id',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      debug('id: ', id)
      NoteContext.byId(id)
        .then(noteContext => {
          debug('outline: ', noteContext)
          if (
            !noteContext ||
            noteContext.deleted ||
            noteContext.type !== 'outline'
          ) {
            return next(
              boom.notFound(
                `Get outline Error: No Outline found with id ${id}`,
                {
                  requestUrl: req.originalUrl
                }
              )
            )
          } else if (!utils.checkReader(req, noteContext.reader)) {
            return next(
              boom.forbidden(`Access to Outline ${id} disallowed`, {
                requestUrl: req.originalUrl
              })
            )
          } else {
            const outline = Object.assign(noteContext.toJSON(), {
              notes: notesListToTree(noteContext.notes)
            })
            debug('updated outline: ', outline)
            res.setHeader('Content-Type', 'application/ld+json')
            res.end(JSON.stringify(outline))
          }
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
