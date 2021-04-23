const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { Notebook } = require('../../models/Notebook')
const { checkOwnership } = require('../../utils/utils')
const { notebooksCacheUpdate } = require('../../utils/cache')
const { metricsQueue } = require('../../utils/metrics')

module.exports = function (app) {
  /**
   * @swagger
   * /notebooks/:id:
   *   delete:
   *     tags:
   *       - notebooks
   *     description: Delete a notebook
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/notebook'
   *     responses:
   *       204:
   *         description: Successfully deleted Notebook
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: no Notebook found with id
   */
  app.use('/', router)
  router.route('/notebooks/:id').delete(jwtAuth, function (req, res, next) {
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
            boom.forbidden(`Access to Notebook ${req.params.id} disallowed`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        let deleted
        try {
          deleted = await Notebook.delete(req.params.id)
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
            boom.notFound(`No Notebook found with id ${req.params.id}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        if (metricsQueue) {
          await metricsQueue.add({
            type: 'deleteNotebook',
            readerId: urlToId(req.params.id)
          })
        }

        await notebooksCacheUpdate(reader.authId)
        res.setHeader('Content-Type', 'application/ld+json')
        res.status(204).end()
      })
      .catch(err => {
        next(err)
      })
  })
}
