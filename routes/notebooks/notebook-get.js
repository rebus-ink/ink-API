const express = require('express')
const router = express.Router()
const passport = require('passport')
const utils = require('../../utils/utils')
const boom = require('@hapi/boom')
const { Notebook } = require('../../models/Notebook')
const { Reader } = require('../../models/Reader')

module.exports = app => {
  app.use('/', router)

  /**
   * @swagger
   * /notebooks/{id}:
   *   get:
   *     tags:
   *       - notebooks
   *     description: Get a notebook object, including a list of notes and noteRelations
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: the short id of the notebook
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A Notebook Object with a list of notes, tags,
   *           noteContexts, collaborators and sources
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/notebook'
   *       401:
   *         desription: 'No Authentication'
   *       403:
   *         description: 'Access to Notebook {id} disallowed'
   *       404:
   *         description: 'No Notebook with ID {id}'
   */

  router.get(
    '/notebooks/:id',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      Notebook.byId(id)
        .then(async notebook => {
          if (!notebook || notebook.deleted) {
            return next(
              boom.notFound(
                `Get Notebook Error: No Notebook found with id ${id}`,
                {
                  requestUrl: req.originalUrl
                }
              )
            )
          } else if (!utils.checkReader(req, notebook.reader)) {
            // if user is not owner, check if it is a collaborator
            const reader = await Reader.byAuthId(req.user)
            const collaborator = utils.checkNotebookCollaborator(
              reader.id,
              notebook
            )
            if (!collaborator.read) {
              return next(
                boom.forbidden(`Access to Notebook ${id} disallowed`, {
                  requestUrl: req.originalUrl
                })
              )
            }
          }
          res.setHeader('Content-Type', 'application/ld+json')
          res.end(JSON.stringify(notebook.toJSON()))
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
