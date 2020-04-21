const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Publication } = require('../models/Publication')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { libraryCacheUpdate } = require('../utils/cache')
const { checkOwnership, urlToId } = require('../utils/utils')

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
   * /publications/batchUpdate:
   *   patch:
   *     tags:
   *       - publications
   *     description: Apply the same update to multiple publications
   *     parameters:
   *       - in: path
   *         name: pubId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/publicationBatchUpdateRequest'
   *       description: body should only include fields to be updated
   *     responses:
   *       204:
   *         description: Successfully updated Publications
   *       207:
   *         description: Multiple status. This is returned if at least one of the changes returned an error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#definitions/publicationBatchUpdateResponse'
   */
  app.use('/', router)
  router
    .route('/publications/batchUpdate')
    .patch(jwtAuth, async function (req, res, next) {
      let errors = []

      if (!req.body || _.isEmpty(req.body)) {
        return next(
          boom.badRequest(
            'Batch Update Publication Request Error: Body must be a JSON object',
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
      if (!req.body.hasOwnProperty('publications')) {
        missingProps.push('publications')
      }
      if (missingProps.length) {
        return next(
          boom.badRequest(
            `Batch Update Publication Request Error: Body missing properties: ${missingProps} `,
            {
              requestUrl: req.originalUrl,
              requestBody: req.body
            }
          )
        )
      }

      const reader = await Reader.byAuthId(req.user)
      req.body.publications.forEach(publicationId => {
        if (!checkOwnership(reader.id, publicationId)) {
          errors.push({
            id: publicationId,
            status: 403,
            message: `Access to publication ${publicationId} disallowed`
          })
          req.body.publications = req.body.publications.filter(
            item => item !== publicationId
          )
        }
      })

      if (req.body.property === 'tags') {
        if (_.isString(req.body.value)) {
          req.body.value = [req.body.value]
        }
        req.body.value.forEach(tag => {
          if (!checkOwnership(reader.id, urlToId(tag))) {
            req.body.publications.forEach(publicationId => {
              errors.push({
                id: publicationId,
                status: 403,
                message: `Access to tag ${tag} disallowed`,
                value: tag
              })
            })
            req.body.value = req.body.value.filter(item => item !== tag)
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
            const result = await Publication.batchUpdate(req.body)

            // if some publicaitons were note found...
            if (result < req.body.publications.length || errors.length > 0) {
              const numberOfErrors = req.body.publications.length - result
              const status = []
              let index = 0
              while (
                status.length < numberOfErrors ||
                index < req.body.publications.length
              ) {
                const exists = await Publication.checkIfExists(
                  req.body.publications[index]
                )
                if (!exists) {
                  status.push({
                    id: req.body.publications[index],
                    status: 404,
                    message: `No Publication found with id ${
                      req.body.publications[index]
                    }`
                  })
                } else {
                  status.push({
                    id: req.body.publications[index],
                    status: 204
                  })
                }
                index++
              }
              res.setHeader('Content-Type', 'application/ld+json')
              res
                .status(207)
                .end(JSON.stringify({ status: status.concat(errors) }))
            } else {
              // if all went well...
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            }
          } catch (err) {
            if (err instanceof ValidationError) {
              return next(
                boom.badRequest(
                  `Validation Error on Batch Update Publication: ${
                    err.message
                  }`,
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
            Publication.attributionTypes.indexOf(req.body.property) === -1 &&
            req.body.property !== 'tags'
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

            const result = await Publication.batchUpdateAddArrayProperty(
              req.body
            )
            if (!_.find(result, { status: 404 }) && errors.length === 0) {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              res.setHeader('Content-Type', 'application/ld+json')
              res
                .status(207)
                .end(JSON.stringify({ status: result.concat(errors) }))
            }
          } else if (
            Publication.attributionTypes.indexOf(req.body.property) > -1
          ) {
            // ATTRIBUTIONS
            const result = await Publication.batchUpdateAddAttribution(
              req.body,
              urlToId(reader.id)
            )
            if (
              !_.find(result, { status: 404 }) &&
              !_.find(result, { status: 400 }) &&
              errors.length === 0
            ) {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              res.setHeader('Content-Type', 'application/ld+json')
              res
                .status(207)
                .end(JSON.stringify({ status: result.concat(errors) }))
            }
          } else {
            // TAGS
            // check ownership of tags. First check that they are strings?

            const result = await Publication.batchUpdateAddTags(
              req.body,
              urlToId(reader.id)
            )
            if (
              !_.find(result, { status: 404 }) &&
              !_.find(result, { status: 400 }) &&
              errors.length === 0
            ) {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
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
            Publication.attributionTypes.indexOf(req.body.property) === -1 &&
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
              const result = await Publication.batchUpdateRemoveArrayProperty(
                req.body
              )
              if (!_.find(result, { status: 404 }) && errors.length === 0) {
                res.setHeader('Content-Type', 'application/ld+json')
                res.status(204).end()
              } else {
                res.setHeader('Content-Type', 'application/ld+json')
                res
                  .status(207)
                  .end(JSON.stringify({ status: result.concat(errors) }))
              }
            } catch (err) {
              console.log(err)
            }
          } else if (
            Publication.attributionTypes.indexOf(req.body.property) > -1
          ) {
            // ATTRIBUTIONS
            // validate values
            if (!_.every(req.body.value, _.isString)) {
              validValues = []
              req.body.value.forEach(value => {
                if (_.isString(value)) {
                  validValues.push(value)
                } else {
                  req.body.publications.forEach(pub => {
                    errors.push({
                      id: pub,
                      status: 400,
                      value: value,
                      message: `Values for ${req.body.property} must be strings`
                    })
                  })
                }
              })
              req.body.value = validValues
            }

            const result = await Publication.batchUpdateRemoveAttribution(
              req.body
            )
            if (!_.find(result, { status: 404 }) && errors.length === 0) {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              res.setHeader('Content-Type', 'application/ld+json')
              res
                .status(207)
                .end(JSON.stringify({ status: result.concat(errors) }))
            }
          } else {
            // TAGS
            // check ownership of tags. First check that they are strings?

            const result = await Publication.batchUpdateRemoveTags(
              req.body,
              urlToId(reader.id)
            )
            if (
              !_.find(result, { status: 404 }) &&
              !_.find(result, { status: 400 }) &&
              errors.length === 0
            ) {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              res.setHeader('Content-Type', 'application/ld+json')
              res
                .status(207)
                .end(JSON.stringify({ status: result.concat(errors) }))
            }
          }

          break
      }
    })
}
