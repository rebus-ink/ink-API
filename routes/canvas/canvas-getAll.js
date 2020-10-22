const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const boom = require('@hapi/boom')
const { urlToId } = require('../../utils/utils')
const { Notebook } = require('../../models/Notebook')
const paginate = require('../_middleware/paginate')
const debug = require('debug')('ink:routes:notebooks-get')
const { notebooksCacheGet } = require('../../utils/cache')
const { Canvas } = require('../../models/Canvas')

module.exports = function (app) {
  /**
   * @swagger
   * /canvas:
   *   get:
   *     tags:
   *       - canvas
   *     description: Get a list of canvas for a reader
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: An array of canvas for the reader (based on the validation token)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/canvas-list'
   *       401:
   *         description: No Authenticationd
   *       404:
   *         description: 'No Reader found'
   */
  app.use('/', router)
  router.get(
    '/canvas',
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

          let canvas = await Canvas.byReader(urlToId(reader.id))

          res.setHeader('Content-Type', 'application/ld+json')
          res.end(
            JSON.stringify({
              items: canvas,
              totalItems: canvas.length // no pagination yet
              // page: req.query.page,
              // pageSize: parseInt(req.query.limit)
            })
          )
        })
        .catch(next)
    }
  )
}
