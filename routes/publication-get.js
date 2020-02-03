const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Publication } = require('../models/Publication')
const debug = require('debug')('hobb:routes:publication')
const utils = require('../utils/utils')
const boom = require('@hapi/boom')

module.exports = function (app) {
  /**
   * @swagger
   * /publications/{pubId}:
   *   get:
   *     tags:
   *       - publications
   *     description: Get a single publication by id
   *     parameters:
   *       - in: path
   *         name: pubId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: The publication object with a list of replies (noteIds) a list of assigned tags
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/publication'
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to publication {pubId} disallowed'
   *       404:
   *         description: 'No Publication with ID {pubId}'
   */
  app.use('/', router)
  router.get(
    '/publications/:pubId',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const pubId = req.params.pubId
      Publication.byId(pubId)
        .then(publication => {
          if (!publication || publication.deleted) {
            return next(
              boom.notFound(`No Publication found with id ${pubId}`, {
                requestUrl: req.originalUrl
              })
            )
          } else if (!utils.checkReader(req, publication.reader)) {
            return next(
              boom.forbidden(`Access to publication ${pubId} disallowed`, {
                type: 'Publication',
                requestUrl: req.originalUrl
              })
            )
          } else {
            debug(publication)
            res.setHeader('Content-Type', 'application/ld+json')
            const publicationJson = publication.toJSON()
            res.end(
              JSON.stringify(
                Object.assign(publicationJson, {
                  replies: publication.replies
                    ? publication.replies
                      .filter(note => !note.deleted)
                      .map(note => note.asRef())
                    : []
                })
              )
            )
          }
        })
        .catch(next)
    }
  )
}
