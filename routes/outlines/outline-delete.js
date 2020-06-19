const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { NoteContext } = require('../../models/NoteContext')
const { checkOwnership } = require('../../utils/utils')
const debug = require('debug')('ink:routes:outline-delete')

module.exports = function (app) {
  /**
   * @swagger
   * /outlines/:id:
   *   delete:
   *     tags:
   *       - outlines
   *     description: Delete an outline
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/outline'
   *     responses:
   *       204:
   *         description: Successfully deleted Outline
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: no Outline found with id
   */
  app.use('/', router)
  router.route('/outlines/:id').delete(jwtAuth, function (req, res, next) {
    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader || reader.deleted) {
          return next(
            boom.notFound('No reader found with this token', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        if (!checkOwnership(reader.id, req.params.id)) {
          return next(
            boom.forbidden(`Access to Outline ${req.params.id} disallowed`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        let deleted
        try {
          deleted = await NoteContext.delete(req.params.id)
          debug('deleted result: ', deleted)
        } catch (err) {
          debug('error: ', err.message)
          return next(
            boom.badRequest(err.message, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }
        if (!deleted) {
          return next(
            boom.notFound(`No Outline found with id ${req.params.id}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(204).end()
      })
      .catch(err => {
        next(err)
      })
  })
}
