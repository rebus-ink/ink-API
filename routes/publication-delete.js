const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Publication } = require('../models/Publication')
const boom = require('@hapi/boom')
const { urlToId } = require('../utils/utils')
const { libraryCacheUpdate } = require('../utils/cache')

const utils = require('../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /readers/{readerId}/publications/{pubId}:
   *   delete:
   *     tags:
   *       - publications
   *     description: DELETE /readers/readerId/publications/pubId
   *     parameters:
   *       - in: path
   *         name: readerId
   *         schema:
   *           type: string
   *         required: true
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
   *       404:
   *         description: Publication not found
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router
    .route('/readers/:readerId/publications/:pubId')
    .delete(jwtAuth, function (req, res, next) {
      const readerId = req.params.readerId
      const pubId = req.params.pubId
      Reader.byId(readerId)
        .then(reader => {
          if (!reader) {
            return next(
              boom.notFound(`No reader with ID ${readerId}`, {
                type: 'Reader',
                id: readerId,
                activity: 'Delete Publication'
              })
            )
          } else if (!utils.checkReader(req, reader)) {
            return next(
              boom.forbidden(`Access to reader ${readerId} disallowed`, {
                type: 'Reader',
                id: readerId,
                activity: 'Delete Publication'
              })
            )
          } else {
            // delete publication
            Publication.delete(urlToId(pubId)).then(async returned => {
              if (returned === null) {
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
              await libraryCacheUpdate(readerId)
              res.status(204).end()
            })
          }
        })

        .catch(err => {
          next(err)
        })
    })
}
