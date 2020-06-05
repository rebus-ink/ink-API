const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const boom = require('@hapi/boom')
const { urlToId } = require('../../utils/utils')
const { Notebook } = require('../../models/Notebook')
const paginate = require('../_middleware/paginate')

module.exports = function (app) {
  /**
   * @swagger
   * /notebooks:
   *   get:
   *     tags:
   *       - notebooks
   *     description: Get a list of notebooks for a reader
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 10
   *           minimum: 10
   *           maximum: 100
   *         description: the number of notebook items to return
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           default: 1
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: ['active', 'archived']
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: the string to search for in name and description of notebooks. Not case sensitive, accepts partial matches
   *       - in : query
   *         name: colour
   *         schema:
   *           type: string
   *         description: colour found in the settings object
   *       - in: query
   *         name: orderBy
   *         type: string
   *         enum: ['name', 'created', 'updated']
   *         default: 'updated'
   *       - in: query
   *         name: reverse
   *         schema:
   *           type: boolean
   *         default: false
   *         description: a modifier to use with orderBy to reverse the order
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: An array of notebooks for the reader (based on the validation token)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/notebook-list'
   *       401:
   *         description: No Authenticationd
   *       404:
   *         description: 'No Reader found'
   */
  app.use('/', router)
  router.get(
    '/notebooks',
    paginate,
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const filters = {
        status: req.query.status,
        search: req.query.search,
        colour: req.query.colour,
        orderBy: req.query.orderBy,
        reverse: req.query.reverse
      }

      Reader.byAuthId(req.user)
        .then(async reader => {
          if (req.query.limit < 10) req.query.limit = 10 // prevents people from cheating by setting limit=0 to get everything

          if (!reader || reader.deleted) {
            return next(
              boom.notFound(`No reader found with this token`, {
                requestUrl: req.originalUrl
              })
            )
          }
          let notebooks = await Notebook.byReader(
            urlToId(reader.id),
            req.query.limit,
            req.skip,
            filters
          )

          let count
          if (notebooks.length < req.query.limit && notebooks.length > 0) {
            count = notebooks.length + req.skip
          } else {
            count = await Notebook.count(urlToId(reader.id), filters)
          }

          res.setHeader('Content-Type', 'application/ld+json')
          res.end(
            JSON.stringify({
              items: notebooks,
              totalItems: count,
              page: req.query.page,
              pageSize: parseInt(req.query.limit)
            })
          )
        })
        .catch(next)
    }
  )
}
