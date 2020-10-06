const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership } = require('../../utils/utils')
const { Notebook_Tag } = require('../../models/Notebook_Tag')
const debug = require('debug')('ink:routes:notebook-put-tag')
const { notebooksCacheUpdate } = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * notebooks/{notebookId}/tags/{tagId}:
   *   put:
   *     tags:
   *       - notebook-tag
   *     description: Assign a Tag to a Notebook
   *     parameters:
   *       - in: path
   *         name: notebookId
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
   *         description: Successfully added Tag to Notebook
   *       400:
   *         description: Cannot assign the same tag twice
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to notebook or tag disallowed'
   *       404:
   *         description:  tag or notebook not found
   */
  app.use('/', router)
  router
    .route('/notebooks/:notebookId/tags/:tagId')
    .put(jwtAuth, function (req, res, next) {
      const tagId = req.params.tagId
      const notebookId = req.params.notebookId
      debug('tagId', tagId, 'notebookId', notebookId)
      Reader.byAuthId(req.user)
        .then(async reader => {
          if (!reader || reader.deleted) {
            return next(
              boom.notFound(`No reader found with this token`, {
                requestUrl: req.originalUrl
              })
            )
          }

          if (!checkOwnership(reader.id, tagId)) {
            return next(
              boom.forbidden(`Access to Tag ${tagId} disallowed`, {
                requestUrl: req.originalUrl
              })
            )
          }
          if (!checkOwnership(reader.id, notebookId)) {
            return next(
              boom.forbidden(`Access to Notebook ${notebookId} disallowed`, {
                requestUrl: req.originalUrl
              })
            )
          }

          try {
            await Notebook_Tag.addTagToNotebook(notebookId, tagId)
            await notebooksCacheUpdate(reader.authId)
            res.status(204).end()
          } catch (err) {
            debug('error: ', err)
            if (err.message === 'no tag') {
              return next(
                boom.notFound(
                  `Add Tag to Notebook Error: No Tag found with id ${tagId}`,
                  {
                    requestUrl: req.originalUrl
                  }
                )
              )
            } else if (err.message === 'no notebook') {
              return next(
                boom.notFound(
                  `Add Tag to Notebook Error: No Notebook found with id ${notebookId}`,
                  {
                    requestUrl: req.originalUrl
                  }
                )
              )
            } else {
              return next(
                boom.badRequest(err.message, {
                  requestUrl: req.originalUrl
                })
              )
            }
          }
        })
        .catch(err => {
          next(err)
        })
    })
}
