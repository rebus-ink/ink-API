const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const boom = require('@hapi/boom')
const { urlToId } = require('../../utils/utils')
const paginate = require('../_middleware/paginate')
const { Canvas } = require('../../models/Canvas')
const { NoteContext } = require('../../models/NoteContext')

module.exports = function (app) {
  /**
   * @swagger
   * /noteContexts:
   *   get:
   *     tags:
   *       - noteContexts
   *     description: Get a list of NoteContexts for a reader
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: query
   *         name: notebook
   *         schema:
   *           type: string
   *         description: shortId of the notebook to filter by
   *     responses:
   *       200:
   *         description: An array of noteContexts for the reader (based on the validation token)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/context-list'
   *       401:
   *         description: No Authenticationd
   *       404:
   *         description: 'No Reader found'
   */
  app.use('/', router)
  router.get(
    '/noteContexts',
    paginate,
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      Reader.byAuthId(req.user)
        .then(async reader => {
          if (!reader || reader.deleted) {
            return next(
              boom.notFound(`No reader found with this token`, {
                requestUrl: req.originalUrl
              })
            )
          }
          let filters = {
            notebook: req.query.notebook
          }

          let contexts = await NoteContext.byReader(urlToId(reader.id), filters)
          res.setHeader('Content-Type', 'application/ld+json')
          res.end(
            JSON.stringify({
              items: contexts,
              totalItems: contexts.length // no pagination yet
              // page: req.query.page,
              // pageSize: parseInt(req.query.limit)
            })
          )
        })
        .catch(next)
    }
  )
}
