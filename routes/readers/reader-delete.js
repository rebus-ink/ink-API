const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const boom = require('@hapi/boom')
const { urlToId } = require('../../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /readers/{id}:
   *   delete:
   *     tags:
   *       - readers
   *     description: Delete a Reader
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: the id of the reader
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Deleted
   *       401:
   *         description: No Authentication
   *       403:
   *         description: access to Reader forbidden (mismatch between reader id and authentication token)
   *       404:
   *         description: Reader not found
   */
  app.use('/', router)
  router.delete(
    '/readers/:id',
    passport.authenticate('jwt', { session: false }),
    async function (req, res, next) {
      const reader = await Reader.byAuthId(req.user)

      const exists = await Reader.checkIfExistsById(req.params.id)
      if (!exists) {
        return next(
          boom.notFound(`No Reader found with id ${req.params.id}`, {
            requestUrl: req.originalUrl,
            requestBody: req.body
          })
        )
      }
      // check ownership
      if (urlToId(reader.id) !== req.params.id) {
        return next(
          boom.forbidden(`Access to reader ${req.params.id} disallowed`, {
            requestUrl: req.originalUrl,
            requestBody: req.body
          })
        )
      }

      await Reader.softDelete(req.params.id)

      res.setHeader('Content-Type', 'application/ld+json')
      res.status(204)
      res.end()
    }
  )
}
