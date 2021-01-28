const express = require('express')
const router = express.Router()
const passport = require('passport')
const { NoteContext } = require('../../models/NoteContext')
const { Reader } = require('../../models/Reader')
const utils = require('../../utils/utils')
const { notesListToTree } = require('../../utils/outline')
const boom = require('@hapi/boom')

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
      NoteContext.byId(id)
        .then(async noteContext => {
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
            // if user is not owner, check if it is a collaborator
            const reader = await Reader.byAuthId(req.user)
            const collaborator = utils.checkNotebookCollaborator(
              reader.id,
              noteContext.notebook
            )
            if (!collaborator.read) {
              return next(
                boom.forbidden(`Access to noteContext ${id} disallowed`, {
                  requestUrl: req.originalUrl
                })
              )
            }

            let nestedNotesList
            try {
              nestedNotesList = notesListToTree(noteContext.notes)
            } catch (err) {
              if (err.message === 'circular') {
                return next(
                  boom.badRequest('Error: outline contains a circular list', {
                    requestUrl: req.originalUrl
                  })
                )
              } else {
                return next(
                  boom.badRequest(
                    `Error: invalid outline structure: ${err.message} `,
                    {
                      requestUrl: req.originalUrl
                    }
                  )
                )
              }
            }
            const outline = Object.assign(noteContext.toJSON(), {
              notes: nestedNotesList
            })
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
