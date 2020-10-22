const express = require('express')
const router = express.Router()
const passport = require('passport')
const utils = require('../../utils/utils')
const boom = require('@hapi/boom')
const { Canvas } = require('../../models/Canvas')

module.exports = app => {
  app.use('/', router)

  /**
   * @swagger
   * /canvas/{id}:
   *   get:
   *     tags:
   *       - canvas
   *     description: GET /canvas/:id
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: the short id of the canvas
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A Canvas Object with notebook information
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/canvas'
   *       401:
   *         desription: 'No Authentication'
   *       403:
   *         description: 'Access to Canvas {id} disallowed'
   *       404:
   *         description: 'No Notebook with ID {id}'
   */

  router.get(
    '/canvas/:id',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      Canvas.byId(id)
        .then(canvas => {
          if (!canvas || canvas.deleted) {
            return next(
              boom.notFound(`Get Canvas Error: No Canvas found with id ${id}`, {
                requestUrl: req.originalUrl
              })
            )
          } else if (!utils.checkReader(req, canvas.reader)) {
            return next(
              boom.forbidden(`Access to Canvas ${id} disallowed`, {
                requestUrl: req.originalUrl
              })
            )
          } else {
            res.setHeader('Content-Type', 'application/ld+json')
            res.end(JSON.stringify(canvas.toJSON()))
          }
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
