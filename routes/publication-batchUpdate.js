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

const batchUpdateProperties = batchUpdateSimpleProperties
  .concat(batchUpdateArrayProperties)
  .concat(Publication.attributionTypes)
  .concat(['tags'])

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
   *       200:
   *         description: Successfully updated Publication
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/publicationBatchUpdateResponse'
   *       207:
   *         description: Multiple status. This is returned if at least one of the changes returned an error
   */
  app.use('/', router)
  router
    .route('/publications/batchUpdate')
    .patch(jwtAuth, async function (req, res, next) {
      let responses = []

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
      req.body.publications.forEach(async publicationId => {
        if (!checkOwnership(reader.id, publicationId)) {
          responses.push({
            publicationId,
            statusCode: 403,
            error: {
              message: `Access to publication ${publicationId} disallowed`,
              requestUrl: req.originalUrl,
              requestBody: req.body
            }
          })
        }
      })

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
            if (result < req.body.publications.length) {
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
              res.status(207).end(JSON.stringify({ status }))
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
            if (!_.find(result, { status: 404 })) {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(207).end(JSON.stringify(result))
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
              !_.find(result, { status: 400 })
            ) {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(207).end(JSON.stringify(result))
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
              !_.find(result, { status: 400 })
            ) {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(207).end(JSON.stringify(result))
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
              if (!_.find(result, { status: 404 })) {
                res.setHeader('Content-Type', 'application/ld+json')
                res.status(204).end()
              } else {
                res.setHeader('Content-Type', 'application/ld+json')
                res.status(207).end(JSON.stringify(result))
              }
            } catch (err) {
              console.log(err)
            }
          } else if (
            Publication.attributionTypes.indexOf(req.body.property) > -1
          ) {
            // ATTRIBUTIONS
            // validate values
            let errors = []
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
              res.status(207).end(JSON.stringify(result.concat(errors)))
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
              !_.find(result, { status: 400 })
            ) {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(204).end()
            } else {
              res.setHeader('Content-Type', 'application/ld+json')
              res.status(207).end(JSON.stringify(result))
            }
          }

          break
      }

      // const pubId = req.params.pubId
      // Publication.byId(pubId)
      //   .then(async pub => {
      //     if (!pub) {
      //       return next(
      //         boom.notFound(`No Publication found with id ${pubId}`, {
      //           requestUrl: req.originalUrl,
      //           requestBody: req.body
      //         })
      //       )
      //     }
      //     const reader = await Reader.byAuthId(req.user)
      //     if (!reader || !checkOwnership(reader.id, pubId)) {
      //       return next(
      //         boom.forbidden(`Access to publication ${pubId} disallowed`, {
      //           requestUrl: req.originalUrl,
      //           requestBody: req.body
      //         })
      //       )
      //     }

      //     const body = req.body
      //     if (typeof body !== 'object' || Object.keys(body).length === 0) {
      //       return next(
      //         boom.badRequest(
      //           'Patch Publication Request Error: Body must be a JSON object',
      //           {
      //             requestUrl: req.originalUrl,
      //             requestBody: req.body
      //           }
      //         )
      //       )
      //     }

      //     // update pub
      //     let updatedPub
      //     try {
      //       updatedPub = await pub.update(body)
      //     } catch (err) {
      //       if (err instanceof ValidationError) {
      //         return next(
      //           boom.badRequest(
      //             `Validation Error on Patch Publication: ${err.message}`,
      //             {
      //               requestUrl: req.originalUrl,
      //               requestBody: req.body,
      //               validation: err.data
      //             }
      //           )
      //         )
      //       } else {
      //         return next(
      //           boom.badRequest(err.message, {
      //             requestUrl: req.originalUrl,
      //             requestBody: req.body
      //           })
      //         )
      //       }
      //     }

      //     if (updatedPub === null) {
      //       return next(
      //         boom.notFound(`No Publication found with id ${body.id}`, {
      //           requestUrl: req.originalUrl,
      //           requestBody: req.body
      //         })
      //       )
      //     }

      //     await libraryCacheUpdate(reader.id)

      //     res.setHeader('Content-Type', 'application/ld+json')
      //     res.status(200).end(JSON.stringify(updatedPub.toJSON()))
      //   })
      //   .catch(err => {
      //     next(err)
      //   })
    })
}
