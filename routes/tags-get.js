const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Tag } = require('../models/Tag')
const { Reader } = require('../models/Reader')
const { Publication } = require('../models/Publication')
const debug = require('debug')('hobb:routes:publication')
const utils = require('../utils/utils')
const boom = require('@hapi/boom')
const { urlToId } = require('../utils/utils')

module.exports = function (app) {
  /**
   * @swagger
   * /tags:
   *   get:
   *     tags:
   *       - tags
   *     description: GET /tags
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: An array of tags for the reader (based on the validation token)
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/definitions/tag'
   *       404:
   *         description: 'No Reader found'
   */
  app.use('/', router)
  router.get(
    '/tags',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      Reader.byAuthId(req.user)
        .then(async reader => {
          if (!reader) {
            return next(
              boom.notFound(`No reader found with this token`, {
                type: 'Reader',
                activity: 'Get Tags'
              })
            )
          }
          let tags = await Tag.byReaderId(urlToId(reader.id))

          tags = tags.filter(tag => !tag.deleted)

          res.setHeader('Content-Type', 'application/ld+json')
          res.end(JSON.stringify(tags))
        })
        .catch(next)
    }
  )
}
