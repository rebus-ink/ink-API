const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Library } = require('../models/library')
const { Source } = require('../models/Source')
const { Reader } = require('../models/Reader')

const boom = require('@hapi/boom')
const { urlToId } = require('../utils/utils')
const _ = require('lodash')

module.exports = app => {
  /**
   * @swagger
   * /search:
   *   post:
   *     tags:
   *       - search
   *     description: send search option objects and get search results back
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Search result object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/search'
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: 'No Reader with ID {id}'
   */
  app.use('/', router)
  router.post(
    '/search',
    passport.authenticate('jwt', { session: false }),
    async function (req, res, next) {
      // get user
      const reader = await Reader.byAuthId(req.user)
      let result = {}

      if (req.body.includeSources) {
        const sources = await Source.search(reader.id, req.body.search)
        result.sources = { items: sources }
      }

      res.send(result)
      // .catch(err => {
      //   next(err)
      // })
    }
  )
}
