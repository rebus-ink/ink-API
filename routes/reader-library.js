const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const { getId } = require('../utils/get-id.js')
const utils = require('../utils/utils')
const paginate = require('./middleware/paginate')
const boom = require('@hapi/boom')

const { libraryCacheGet } = require('../utils/cache')

/**
 * @swagger
 * definition:
 *   publication-ref:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *       summaryMap:
 *         type: object
 *         properties:
 *           en:
 *             type: string
 *       '@context':
 *         type: array
 *       author:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       editor:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       creator:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       contributor:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       illustrator:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       publisher:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       translator:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       replies:
 *         type: array
 *         items:
 *           type: string
 *           format: url
 *       json:
 *         type: object
 *       numberOfPages:
 *         type: number
 *       encodingFormat:
 *         type: string
 *       url:
 *         type: string
 *       dateModified:
 *         type: string
 *         format: timestamp
 *       bookEdition:
 *         type: string
 *       isbn:
 *         type: string
 *       copyrightYear:
 *         type: number
 *       genre:
 *         type: string
 *       license:
 *         type: string
 *       wordCount:
 *         type: number
 *       description:
 *         type: string
 *       status:
 *         type: string
 *         enum: ['test']
 *       inDirection:
 *         type: string
 *         enum: ['ltr', 'rtl']
 *       resources:
 *         type: array
 *         items:
 *           $ref: '#/definitions/link'
 *       abstract:
 *         type: string
 *       datePublished:
 *         type: string
 *         format: timestamp
 *       readerId:
 *         type: string
 *         format: url
 *       published:
 *         type: string
 *         format: timestamp
 *       updated:
 *         type: string
 *         format: timestamp
 *   tag:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *         enum: ['reader:Tag']
 *       name:
 *         type: string
 *       tagType:
 *         type: string
 *       published:
 *         type: string
 *         format: timestamp
 *       updated:
 *         type: string
 *         format: timestamp
 *   library:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *         enum: ['Collection']
 *       summaryMap:
 *         type: object
 *         properties:
 *           en:
 *             type: string
 *       '@context':
 *         type: array
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *       totalItems:
 *         type: integer
 *       items:
 *         type: array
 *         items:
 *           $ref: '#/definitions/publication-ref'
 *
 */
module.exports = app => {
  /**
   * @swagger
   * /reader-{id}/library:
   *   get:
   *     tags:
   *       - readers
   *     description: GET /reader-:id/library
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: the short id of the reader
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 10
   *           minimum: 10
   *           maximum: 100
   *         description: the number of library items to return
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           default: 1
   *       - in: query
   *         name: attribution
   *         schema:
   *           type: string
   *         description: a search in the attribution field. Will also return partial matches.
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: ['author', 'editor', 'contributor', 'creator', 'illustrator', 'publisher', 'translator']
   *         description: a modifier for attribution to specify the type of attribution
   *       - in: query
   *         name: author
   *         schema:
   *           type: string
   *         description: will return only exact matches.
   *       - in: query
   *         name: language
   *         schema:
   *           type: string
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           enum: ['title', 'datePublished']
   *         description: used to order either alphabetically by title or by date published (most recent first)
   *       - in: query
   *         name: reverse
   *         schema:
   *           type: boolean
   *         description: a modifier to use with orderBy to reverse the order
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A list of publications for the reader
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/library'
   *       404:
   *         description: 'No Reader with ID {id}'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   */
  app.use('/', router)
  router.get(
    '/reader-:id/library',
    paginate,
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      const filters = {
        author: req.query.author,
        attribution: req.query.attribution,
        role: req.query.role,
        title: req.query.title,
        orderBy: req.query.orderBy,
        reverse: req.query.reverse,
        collection: req.query.stack,
        language: req.query.language
      }
      let returnedReader
      if (req.query.limit < 10) req.query.limit = 10 // prevents people from cheating by setting limit=0 to get everything

      libraryCacheGet(id, !!req.headers['if-modified-since'])
        .then(value => {
          if (
            value &&
            req.headers['if-modified-since'] &&
            req.headers['if-modified-since'] > value
          ) {
            res.status(304)
          }
          return Reader.getLibrary(id, req.query.limit, req.skip, filters)
        })
        .then(reader => {
          if (!reader) {
            return next(
              boom.notFound(`No reader with ID ${id}`, {
                type: 'Reader',
                id,
                activity: 'Get Library'
              })
            )
          } else if (!utils.checkReader(req, reader)) {
            return next(
              boom.forbidden(`Access to reader ${id} disallowed`, {
                type: 'Reader',
                id,
                activity: 'Get Library'
              })
            )
          } else {
            returnedReader = reader
            // skip count query if we know we are at the last page
            if (
              reader.publications.length < req.query.limit &&
              reader.publications.length > 0
            ) {
              return Promise.resolve(reader.publications.length + req.skip)
            }
            return Reader.getLibraryCount(id, filters)
          }
        })
        .then(count => {
          let reader = returnedReader
          res.setHeader(
            'Content-Type',
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
          res.end(
            JSON.stringify({
              '@context': 'https://www.w3.org/ns/activitystreams',
              summaryMap: {
                en: `Streams for reader with id ${id}`
              },
              type: 'Collection',
              id: getId(`/reader-${id}/library`),
              totalItems: parseInt(count),
              items: reader.publications,
              tags: reader.tags,
              page: req.query.page,
              pageSize: parseInt(req.query.limit)
            })
          )
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
