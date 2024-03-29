const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { NoteContext } = require('../../models/NoteContext')
const { checkOwnership } = require('../../utils/utils')
const { metricsQueue } = require('../../utils/metrics')

module.exports = function (app) {
  /**
   * @swagger
   * /noteContexts/:id:
   *   delete:
   *     tags:
   *       - noteContexts
   *     description: Delete a noteContext
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully deleted NoteContext
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: no NoteContext found with id
   */
  app.use('/', router)
  router.route('/noteContexts/:id').delete(jwtAuth, function (req, res, next) {
    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader || reader.deleted) {
          return next(
            boom.notFound(`No reader found with this token`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        if (!checkOwnership(reader.id, req.params.id)) {
          return next(
            boom.forbidden(
              `Access to NoteContext ${req.params.id} disallowed`,
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }

        let deleted
        try {
          deleted = await NoteContext.delete(req.params.id)
        } catch (err) {
          return next(
            boom.badRequest(err.message, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }
        if (!deleted) {
          return next(
            boom.notFound(`No NoteContext found with id ${req.params.id}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        if (metricsQueue) {
          await metricsQueue.add({
            type: 'deleteNoteContext',
            readerId: urlToId(req.params.id)
          })
        }

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(204).end()
      })
      .catch(err => {
        next(err)
      })
  })
}
