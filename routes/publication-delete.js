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
      Publication.byId(pubId)
        .then(async pub => {
          if (!pub) {
            return next(
              boom.notFound(
                `publication with id ${pubId} does not exist or has already been deleted`,
                {
                  type: 'Publication',
                  id: pubId,
                  activity: 'Delete Publication'
                }
              )
            )
          }
          const reader = await Reader.byAuthId(req.user)
          if (!reader || !checkOwnership(reader.id, pubId)) {
            return next(
              boom.forbidden(`Access to publication ${pubId} disallowed`, {
                type: 'Publication',
                id: pubId,
                activity: 'Delete Publication'
              })
            )
          }

          await pub.delete()

          await libraryCacheUpdate(reader.id)
          res.status(204).end()
        })

        .catch(err => {
          next(err)
        })
    })
}
