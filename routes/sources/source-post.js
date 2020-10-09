const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Source } = require('../../models/Source')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { libraryCacheUpdate, tagsCacheUpdate, notebooksCacheUpdate } = require('../../utils/cache')
const debug = require('debug')('ink:routes:source-post')
const { metricsQueue } = require('../../utils/metrics')
const { Tag } = require('../../models/Tag')
const { Source_Tag } = require('../../models/Source_Tag')
const { urlToId } = require('../../utils/utils')
const { Notebook } = require('../../models/Notebook')
const { Notebook_Source } = require('../../models/Notebook_Source')

module.exports = function (app) {
  /**
   * @swagger
   * /sources:
   *   post:
   *     tags:
   *       - sources
   *     description: Create a Source
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/source'
   *     responses:
   *       201:
   *         description: Successfully created Source
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/source'
   *       400:
   *         description: Validation error
   *       401:
   *         description: No Authentication
   *       403:
   *         description: 'Access to reader disallowed'
   */
  app.use('/', router)
  router.route('/sources').post(jwtAuth, function (req, res, next) {
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
            boom.badRequest(
              'Create Source Error: Request body must be a JSON object',
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
        }
        let createdSource
        try {
          createdSource = await Source.createSource(reader, body)
          debug('createdSource: ', createdSource)
        } catch (err) {
          debug('error: ', err.message)
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Create Source: ${err.message}`,
                {
                  validation: err.data,
                  requestUrl: req.originalUrl,
                  requestBody: req.body
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
        let tags
        if (body.tags) {
          let newTags = body.tags.filter(tag => {
            return !tag.id
          })
          if (newTags) {
            newTags = await Tag.createMultipleTags(
              createdSource.readerId,
              newTags
            )
            await tagsCacheUpdate(reader.authId)
          }
          tags = body.tags.filter(tag => !!tag.id).concat(newTags)
          let tagIds = tags.map(tag => tag.id)
          await Source_Tag.addMultipleTagsToSource(
            urlToId(createdSource.id),
            tagIds
          )
        }

        let notebooks
        if (body.notebooks) {
          let newNotebooks = body.notebooks.filter(notebook => {
            return !notebook.id
          })
          if (newNotebooks) {
            newNotebooks = await Notebook.createMultipleNotebooks(
              createdSource.readerId,
              newNotebooks
            )
            // await notebooksCacheUpdate(reader.authId)
          }
          notebooks = body.notebooks
            .filter(notebook => !!notebook.id)
            .concat(newNotebooks)
          let notebookIds = notebooks.map(notebook => notebook.id)
          await Notebook_Source.addMultipleNotebooksToSource(
            urlToId(createdSource.id),
            notebookIds
          )
        }

        const finishedSource = createdSource.toJSON()
        await libraryCacheUpdate(reader.authId)
        await notebooksCacheUpdate(reader.authId)

        if (metricsQueue) {
          await metricsQueue.add({
            type: 'createSource',
            readerId: finishedSource.readerId
          })
        }

        res.setHeader('Content-Type', 'application/ld+json')
        res.setHeader('Location', finishedSource.id)
        res.status(201).end(JSON.stringify(finishedSource))
      })
      .catch(err => {
        next(err)
      })
  })
}
