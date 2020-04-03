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
const { checkOwnership } = require('../utils/utils')

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

      // REPLACE
      if (req.body.operation === 'replace') {
        try {
          const result = await Publication.batchUpdate(req.body)
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
          }
          res.setHeader('Content-Type', 'application/ld+json')
          res.status(204).end()
        } catch (err) {
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Batch Update Publication: ${err.message}`,
                {
                  requestUrl: req.originalUrl,
                  requestBody: req.body,
                  validation: err.data
                }
              )
            )
          } else if (err.message === 'no replace array') {
            return next(
              boom.badRequest(
                `Cannot use 'replace' to update an array property: ${
                  req.body.property
                }. Use 'add' or 'remove' instead`,
                {
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
      } else {
        try {
          const result = await Publication.batchUpdateArrayProperty(req.body)
          res.setHeader('Content-Type', 'application/ld+json')
          res.status(207).end(JSON.stringify({ status: result }))
        } catch (err) {
          console.log('error!!!', err)
        }
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
