const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { libraryCacheUpdate } = require('../utils/cache')
const { Publication_Tag } = require('../models/Publications_Tags')

const utils = require('../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /readers/{readerId}/publications/{pubId}/tags/{tagId}:
   *   put:
   *     tags:
   *       - tags
   *       - publications
   *     description: PUT /readers/:readerId/publications/:pubId/tags/:tagId
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
   *       - in: path
   *         name: tagId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully added Tag to Publication
   *       400:
   *         description: Cannot assign the same tag twice
   *       404:
   *         description: reader / publication or tag not found
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router
    .route('/readers/:readerId/publications/:pubId/tags/:tagId')
    .put(jwtAuth, function (req, res, next) {
      const readerId = req.params.readerId
      const pubId = req.params.pubId
      const tagId = req.params.tagId
      Reader.byId(readerId)
        .then(reader => {
          if (!reader) {
            return next(
              boom.notFound(`No reader with ID ${readerId}`, {
                type: 'Reader',
                id: readerId,
                activity: 'Add Tag to Publication'
              })
            )
          } else if (!utils.checkReader(req, reader)) {
            return next(
              boom.forbidden(`Access to reader ${readerId} disallowed`, {
                type: 'Reader',
                id: readerId,
                activity: 'Add Tag to Publication'
              })
            )
          }

          Publication_Tag.addTagToPub(pubId, tagId).then(async result => {
            if (result instanceof Error) {
              switch (result.message) {
                case 'duplicate':
                  return next(
                    boom.badRequest(
                      `duplicate Publication ${pubId} already asssociated with tag ${tagId}`,
                      {
                        type: `Publication_Tag`,
                        target: pubId,
                        object: tagId,
                        activity: 'Add Tag to Publication'
                      }
                    )
                  )

                case 'no publication':
                  return next(
                    boom.notFound(`no publication found with id ${pubId}`, {
                      type: 'Publication',
                      id: pubId,
                      activity: 'Add Tag to Publication'
                    })
                  )

                case 'no tag':
                  return next(
                    boom.notFound(`no tag found with id ${tagId}`, {
                      type: 'reader:Tag',
                      id: tagId,
                      activity: 'Add Tag to Publication'
                    })
                  )

                default:
                  return next(err)
              }
            } else {
              await libraryCacheUpdate(readerId)
              res.status(204).end()
            }
          })
        })
        .catch(err => {
          next(err)
        })
    })
}
