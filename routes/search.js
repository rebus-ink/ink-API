const express = require('express')
const router = express.Router()
const boom = require('@hapi/boom')
const request = require('request')
const { urlToId } = require('../utils/utils')
const { Publication_Tag } = require('../models/Publications_Tags')

/**
 * @swagger
 * definition:
 *   search-result:
 *     properties:
 *       id:
 *         type: string
 *       documentId:
 *         type: string
 *       documentUrl:
 *         type: string
 *         format: url
 *       '@context':
 *         type: array
 *       highlights:
 *         type: array
 *         items:
 *           type: string
 *   search-results:
 *     properties:
 *       items:
 *         type: array
 *         items:
 *           $ref: '#/definitions/search-result'
 *
 */
module.exports = app => {
  /**
   * @swagger
   * /reader-{id}/search:
   *   get:
   *     tags:
   *       - readers
   *     description: GET /reader-:id/search
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: the short id of the reader
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: the string to search against
   *       - in: query
   *         name: exact
   *         schema:
   *           type: string
   *           enum: ['true', 'false']
   *           default: 'false'
   *       - in: query
   *         name: publication
   *         schema:
   *           type: string
   *         description: the id of the publication to search. Should not be used with a collection filter.
   *       - in: query
   *         name: collection
   *         schema:
   *           type: string
   *         description: the name of the collection. Should not be used with a publication filter.
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A list search results
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/search-results'
   *       404:
   *         description: 'No Reader with ID {id}'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router.get(
    '/reader-:id/search',
    //  passport.authenticate('jwt', { session: false }),
    async function (req, res, next) {
      const id = req.params.id
      if (!req.query.search) {
        return next(
          boom.badRequest(`missing search query parameter`, {
            missingParams: ['req.query.search'],
            activity: 'Search'
          })
        )
      }

      let query, filter

      // filter by publication?
      if (req.query.publication) {
        if (req.query.publication.startsWith('http:')) {
          req.query.publication = urlToId(req.query.publication)
        }
        filter = [
          { term: { readerId: id } },
          { term: { publicationId: req.query.publication } }
        ]
      } else {
        filter = [{ term: { readerId: id } }]
      }

      // filter by collection?
      if (req.query.collection) {
        const list = await Publication_Tag.getIdsByCollection(
          req.query.collection,
          id
        )
        filter = [
          { term: { readerId: id } },
          { terms: { publicationId: list } }
        ]
      }

      // exact search?
      if (req.query.exact) {
        query = {
          bool: {
            must: [
              {
                match_phrase: {
                  content: req.query.search
                }
              }
            ],
            filter: filter
          }
        }
      } else {
        query = {
          bool: {
            must: [{ match: { content: req.query.search } }],
            filter: filter
          }
        }
      }

      const searchObject = {
        query: query,
        highlight: {
          fields: {
            content: {
              fragment_size: 200,
              boundary_chars: '.\n',
              boundary_max_scan: 30
            }
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>']
        }
      }

      request.get(
        `${process.env.ELASTIC_SEARCH_URL}/document/_search`,
        {
          json: true,
          body: searchObject,
          auth: {
            user: process.env.ELASTIC_SEARCH_LOGIN,
            pass: process.env.ELASTIC_SEARCH_PASSWORD
          }
        },
        (err, result) => {
          if (err) {
            return next(
              boom.failedDependency(err.message, {
                service: 'elastic search',
                activity: 'Search'
              })
            )
          }
          res.status(result.statusCode).send(result.body)
        }
      )
    }
  )
}
