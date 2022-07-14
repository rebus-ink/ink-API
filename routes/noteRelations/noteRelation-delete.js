const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { NoteRelation } = require('../../models/NoteRelation')
const { checkOwnership } = require('../../utils/utils')
const { notesCacheUpdate } = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * /noteRelations/:id:
   *   delete:
   *     tags:
   *       - noteRelations
   *     description: Delete a NoteRelation
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/noteRelation'
   *     responses:
   *       204:
   *         description: Successfully deleted NoteRelation
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: no NoteRelation found with id
   */
  app.use('/', router)
  router.route('/noteRelations/:id').delete(jwtAuth, function (req, res, next) {
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
              `Access to NoteRelation ${req.params.id} disallowed`,
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }
        let deleted
        try {
          deleted = await NoteRelation.delete(req.params.id)
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
            boom.notFound(`No NoteRelation found with id ${req.params.id}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        await notesCacheUpdate(reader.authId)
        res.setHeader('Content-Type', 'application/ld+json')
        res.status(204).end()
      })
      .catch(err => {
        next(err)
      })
  })
}
