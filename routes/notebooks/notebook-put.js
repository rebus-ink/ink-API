const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { urlToId, checkOwnership } = require('../../utils/utils')
const { Notebook } = require('../../models/Notebook')
const debug = require('debug')('ink:routes:notebook-put')

module.exports = function (app) {
  /**
   * @swagger
   * /notebooks/:id:
   *   put:
   *     tags:
   *       - notebooks
   *     description: Update a notebook
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/notebook'
   *     responses:
   *       200:
   *         description: Successfully updated Notebook
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/notebook'
   *       400:
   *         description: Validation error
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: no Notebook found with id {id}
   */
  app.use('/', router)
  router.route('/notebooks/:id').put(jwtAuth, function (req, res, next) {
    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader || reader.deleted) {
          return next(
            boom.notFound(`No reader found with this token`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        const body = req.body
        debug('request body: ', body)
        if (typeof body !== 'object' || _.isEmpty(body)) {
          return next(
            boom.badRequest('Body must be a JSON object', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        // check owndership of Notebook
        if (!checkOwnership(reader.id, req.params.id)) {
          return next(
            boom.forbidden(`Access to Notebook ${req.params.id} disallowed`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        body.id = req.params.id
        body.readerId = urlToId(reader.id)

        let updatedNotebook
        try {
          updatedNotebook = await Notebook.update(body)
          debug('updated notebook: ', updatedNotebook)
        } catch (err) {
          debug('error: ', err.message)
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Update Notebook: ${err.message}`,
                {
                  requestUrl: req.originalUrl,
                  requestBody: req.body,
                  validation: err.data
                }
              )
            )
          } else {
            return next(
              boom.badRequest(err.message, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }
        }

        if (!updatedNotebook) {
          return next(
            boom.notFound(`No Notebook found with id ${req.params.id}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        res.setHeader('Content-Type', 'application/ld+json')
        res.status(200).end(JSON.stringify(updatedNotebook.toJSON()))
      })
      .catch(err => {
        next(err)
      })
  })
}
