const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Publication } = require('../models/Publication')
const boom = require('@hapi/boom')
const { checkOwnership } = require('../utils/utils')
const { libraryCacheUpdate } = require('../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * /publications/{pubId}:
   *   delete:
   *     tags:
   *       - publications
   *     description: Delete a publication by id
   *     parameters:
   *       - in: path
   *         name: pubId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully deleted Publication
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to publication {pubId} disallowed'
   *       404:
   *         description: Publication not found
   */
  app.use('/', router)
  router
    .route('/publications/:pubId')
    .delete(jwtAuth, function (req, res, next) {
      const pubId = req.params.pubId
      Reader.byAuthId(req.user)
        .then(async reader => {
          if (!reader || !checkOwnership(reader.id, pubId)) {
            const pub = await Publication.byId(pubId)
            if (!pub) {
              return next(
                boom.notFound(`No Publication found with id ${pubId}`, {
                  requestUrl: req.originalUrl
                })
              )
            }

            return next(
              boom.forbidden(`Access to publication ${pubId} disallowed`, {
                requestUrl: req.originalUrl
              })
            )
          }

          const result = await Publication.delete(pubId)
          if (!result) {
            return next(
              boom.notFound(`No Publication found with id ${pubId}`, {
                requestUrl: req.originalUrl
              })
            )
          }

          await libraryCacheUpdate(reader.id)
          res.status(204).end()
        })
        .catch(err => {
          next(err)
        })
    })
}
