const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Source } = require('../../models/Source')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { checkOwnership, urlToId } = require('../../utils/utils')
const {
  libraryCacheUpdate,
  notebooksCacheUpdate
} = require('../../utils/cache')

const batchUpdateSimpleProperties = [
  'type',
  'bookFormat',
  'status',
  'encodingFormat'
]

const batchUpdateArrayProperties = ['keywords', 'inLanguage']

module.exports = function (app) {
  /**
   * @swagger
   * /sources/batchUpdate:
   *   patch:
   *     tags:
   *       - sources
   *     description: Apply the same update to multiple Sources
   *     parameters:
   *       - in: path
   *         name: sourceId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/sourceBatchUpdateRequest'
   *       description: body should only include fields to be updated
   *     responses:
   *       204:
   *         description: Successfully updated all Sources
   *       207:
   *         description: Multiple status. This is returned if at least one of the changes returned an error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#definitions/sourceBatchUpdateResponse'
   */
  app.use('/', router)
  router
    .route('/sources/batchUpdate')
    .patch(jwtAuth, async function (req, res, next) {
      let errors = []
      if (!req.body || _.isEmpty(req.body)) {
        return next(
          boom.badRequest(
            'Batch Update Source Request Error: Body must be a JSON object',
            {
              requestUrl: req.originalUrl,
              requestBody: req.body
            }
          )
        )
      }

      // check that it has the right properties
      let missingProps = []
      if (!req.body.hasOwnProperty('property')) missingProps.push('property')
      if (!req.body.hasOwnProperty('value')) missingProps.push('value')
      if (!req.body.hasOwnProperty('operation')) missingProps.push('operation')
      if (!req.body.hasOwnProperty('sources')) {
        missingProps.push('sources')
      }
      if (missingProps.length) {
        return next(
          boom.badRequest(
            `Batch Update Source Request Error: Body missing properties: ${missingProps} `,
            {
              requestUrl: req.originalUrl,
              requestBody: req.body
            }
          )
        )
      }

      const reader = await Reader.byAuthId(req.user)
      if (!reader || reader.deleted) {
        return next(
          boom.notFound('No reader found with this token', {
            requestUrl: req.originalUrl,
            requestBody: req.body
          })
        )
      }

      req.body.sources.forEach(sourceId => {
        if (!checkOwnership(reader.id, sourceId)) {
          errors.push({
            id: sourceId,
            status: 403,
            message: `Access to source ${sourceId} disallowed`
          })
          req.body.sources = req.body.sources.filter(item => item !== sourceId)
        }
      })

      if (req.body.property === 'tags') {
        if (_.isString(req.body.value)) {
          req.body.value = [req.body.value]
        }
        req.body.value.forEach(tag => {
          if (!checkOwnership(reader.id, urlToId(tag))) {
            req.body.sources.forEach(sourceId => {
              errors.push({
                id: sourceId,
                status: 403,
                message: `Access to tag ${tag} disallowed`,
                value: tag
              })
            })
            req.body.value = req.body.value.filter(item => item !== tag)
          }
        })
      }

      if (req.body.property === 'notebooks') {
        if (_.isString(req.body.value)) {
          req.body.value = [req.body.value]
        }
        req.body.value.forEach(notebook => {
          if (!checkOwnership(reader.id, urlToId(notebook))) {
            req.body.sources.forEach(sourceId => {
              errors.push({
                id: sourceId,
                status: 403,
                message: `Access to notebook ${notebook} disallowed`,
                value: notebook
              })
            })
            req.body.value = req.body.value.filter(item => item !== notebook)
          }
        })
      }

      switch (req.body.operation) {
        // ************************************** REPLACE *********************************
        case 'replace':
          if (batchUpdateSimpleProperties.indexOf(req.body.property) === -1) {
            return next(
              boom.badRequest(`Cannot replace property ${req.body.property}`, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }

          try {
            const result = await Source.batchUpdate(req.body)
            // if some sources were note found...
            if (result < req.body.sources.length || errors.length > 0) {
              const numberOfErrors = req.body.sources.length - result
              const status = []
              let index = 0
              while (
                status.length < numberOfErrors ||
                index < req.body.sources.length
              ) {
                const exists = await Source.checkIfExists(
                  req.body.sources[index]
                )
                if (!exists) {
                  status.push({
                    id: req.body.sources[index],
                    status: 404,
                    message: `No Source found with id ${
                      req.body.sources[index]
                    }`
                  })
                } else {
                  status.push({
                    id: req.body.sources[index],
                    status: 204
                  })
                }
                index++
              }
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res
                .status(207)
                .end(JSON.stringify({ status: status.concat(errors) }))
            } else {
              // if all went well...
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            }
          } catch (err) {
            if (err instanceof ValidationError) {
              return next(
                boom.badRequest(
                  `Validation Error on Batch Update Source: ${err.message}`,
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

        // *********************************************** ADD *******************************
        case 'add':
          if (
            batchUpdateArrayProperties.indexOf(req.body.property) === -1 &&
            Source.attributionTypes.indexOf(req.body.property) === -1 &&
            req.body.property !== 'tags' &&
            req.body.property !== 'notebooks'
          ) {
            return next(
              boom.badRequest(`Cannot add property ${req.body.property}`, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }

          if (!_.isArray(req.body.value)) {
            req.body.value = [req.body.value]
          }

          // metadata array properties
          if (batchUpdateArrayProperties.indexOf(req.body.property) > -1) {
            // only takes string or array of strings
            let error
            req.body.value.forEach(word => {
              if (!_.isString(word)) {
                error = true
              }
            })
            if (error) {
              return next(
                boom.badRequest(
                  `${
                    req.body.property
                  } should be a string or an array of strings`,
                  {
                    requestUrl: req.originalUrl,
                    requestBody: req.body
                  }
                )
              )
            }

            const result = await Source.batchUpdateAddArrayProperty(req.body)
            if (!_.find(result, { status: 404 }) && errors.length === 0) {
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res
                .status(207)
                .end(JSON.stringify({ status: result.concat(errors) }))
            }
          } else if (Source.attributionTypes.indexOf(req.body.property) > -1) {
            // ATTRIBUTIONS
            const result = await Source.batchUpdateAddAttribution(
              req.body,
              urlToId(reader.id)
            )
            if (
              !_.find(result, { status: 404 }) &&
              !_.find(result, { status: 400 }) &&
              errors.length === 0
            ) {
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res
                .status(207)
                .end(JSON.stringify({ status: result.concat(errors) }))
            }
          } else if (req.body.property === 'tags') {
            // TAGS
            // check ownership of tags. First check that they are strings?

            const result = await Source.batchUpdateAddTags(
              req.body,
              urlToId(reader.id)
            )
            if (
              !_.find(result, { status: 404 }) &&
              !_.find(result, { status: 400 }) &&
              errors.length === 0
            ) {
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res
                .status(207)
                .end(JSON.stringify({ status: result.concat(errors) }))
            }
          } else {
            // notebooks
            const result = await Source.batchUpdateAddNotebooks(
              req.body,
              urlToId(reader.id)
            )
            if (
              !_.find(result, { status: 404 }) &&
              !_.find(result, { status: 400 }) &&
              errors.length === 0
            ) {
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res
                .status(207)
                .end(JSON.stringify({ status: result.concat(errors) }))
            }
          }
          break

        // *********************************************** REMOVE *******************************
        case 'remove':
          if (
            batchUpdateArrayProperties.indexOf(req.body.property) === -1 &&
            Source.attributionTypes.indexOf(req.body.property) === -1 &&
            req.body.property !== 'tags'
          ) {
            return next(
              boom.badRequest(`Cannot remove property ${req.body.property}`, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }

          // metadata array properties
          if (batchUpdateArrayProperties.indexOf(req.body.property) > -1) {
            // only takes string or array of strings
            if (!_.isArray(req.body.value)) {
              req.body.value = [req.body.value]
            }
            let error
            req.body.value.forEach(word => {
              if (!_.isString(word)) {
                error = true
              }
            })
            if (error) {
              return next(
                boom.badRequest(
                  `${
                    req.body.property
                  } should be a string or an array of strings`,
                  {
                    requestUrl: req.originalUrl,
                    requestBody: req.body
                  }
                )
              )
            }

            try {
              const result = await Source.batchUpdateRemoveArrayProperty(
                req.body
              )
              if (!_.find(result, { status: 404 }) && errors.length === 0) {
                await libraryCacheUpdate(reader.authId)
                await notebooksCacheUpdate(reader.authId)

                res.setHeader('Content-Type', 'application/ld+json')
                res.status(204).end()
              } else {
                await libraryCacheUpdate(reader.authId)
                await notebooksCacheUpdate(reader.authId)

                res.setHeader('Content-Type', 'application/ld+json')
                res
                  .status(207)
                  .end(JSON.stringify({ status: result.concat(errors) }))
              }
            } catch (err) {
              console.log(err)
            }
          } else if (Source.attributionTypes.indexOf(req.body.property) > -1) {
            // ATTRIBUTIONS
            // validate values
            if (!_.every(req.body.value, _.isString)) {
              validValues = []
              req.body.value.forEach(value => {
                if (_.isString(value)) {
                  validValues.push(value)
                } else {
                  req.body.sources.forEach(source => {
                    errors.push({
                      id: source,
                      status: 400,
                      value: value,
                      message: `Values for ${req.body.property} must be strings`
                    })
                  })
                }
              })
              req.body.value = validValues
            }

            const result = await Source.batchUpdateRemoveAttribution(req.body)
            if (!_.find(result, { status: 404 }) && errors.length === 0) {
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res
                .status(207)
                .end(JSON.stringify({ status: result.concat(errors) }))
            }
          } else {
            // TAGS
            // check ownership of tags. First check that they are strings?

            const result = await Source.batchUpdateRemoveTags(
              req.body,
              urlToId(reader.id)
            )
            if (
              !_.find(result, { status: 404 }) &&
              !_.find(result, { status: 400 }) &&
              errors.length === 0
            ) {
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)

              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              await libraryCacheUpdate(reader.authId)
              await notebooksCacheUpdate(reader.authId)
              res.setHeader('Content-Type', 'application/ld+json')
              res
                .status(207)
                .end(JSON.stringify({ status: result.concat(errors) }))
            }
          }

          break

        default:
          return next(
            boom.badRequest(
              `Batch Update Source Request Error: ${
                req.body.operation
              } is not a valid operation. Must be 'replace', 'add' or 'remove' `,
              {
                requestUrl: req.originalUrl,
                requestBody: req.body
              }
            )
          )
      }
    })
}
