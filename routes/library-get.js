const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Library } = require('../models/library')
const paginate = require('./middleware/paginate')
const boom = require('@hapi/boom')
const { urlToId } = require('../utils/utils')
const _ = require('lodash')

const { libraryCacheGet } = require('../utils/cache')

module.exports = app => {
  /**
   * @swagger
   * /library:
   *   get:
   *     tags:
   *       - publications
   *     description: GET a collection of publications and tags for a reader
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
   *         description: a search through attributions with the role of author. Will only return exact matches.
   *       - in: query
   *         name: language
   *         schema:
   *           type: string
   *         description: the two-letter language code to filter by.
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         enum: ['Article', 'Blog', 'Book', 'Chapter', 'Collection', 'Comment', 'Conversation', 'Course', 'Dataset', 'Drawing', 'Episode', 'Manuscript', 'Map', 'MediaObject', 'MusicRecording', 'Painting', 'Photograph', 'Play', 'Poster', 'PublicationIssue', 'PublicationVolume', 'Review', 'ShortStory', 'Thesis', 'VisualArtwork', 'WebContent']
   *         description: the type of publication to filter by.
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           enum: ['title', 'datePublished']
   *         description: used to order either alphabetically by title or by date of creation of the publication object (most recent first)
   *       - in: query
   *         name: reverse
   *         schema:
   *           type: boolean
   *         default: false
   *         description: a modifier to use with orderBy to reverse the order
   *       - in: header
   *         name: If-Modified-Since
   *         schema:
   *           type: string
   *         description: a timestamp of the last response
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
   *       304:
   *         description: 'Not modified since the last request'
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: 'No Reader with ID {id}'
   */
  app.use('/', router)
  router.get(
    '/library',
    paginate,
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const filters = {
        author: req.query.author,
        attribution: req.query.attribution,
        role: req.query.role,
        title: req.query.title,
        orderBy: req.query.orderBy,
        reverse: req.query.reverse,
        collection: req.query.stack,
        language: req.query.language,
        type: req.query.type,
        keyword: req.query.keyword,
        search: req.query.search
      }
      let returnedReader
      if (req.query.limit < 10) req.query.limit = 10 // prevents people from cheating by setting limit=0 to get everything

      libraryCacheGet(req.user, !!req.headers['if-modified-since'])
        .then(value => {
          if (
            value &&
            req.headers['if-modified-since'] &&
            req.headers['if-modified-since'] > value
          ) {
            res.status(304)
          }
          return Library.getLibrary(
            req.user,
            req.query.limit,
            req.skip,
            filters
          )
        })
        .then(reader => {
          if (!reader) {
            return next(
              boom.notFound(`No Reader found with id ${req.user}`, {
                requestUrl: req.originalUrl
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
            return Library.getLibraryCount(urlToId(reader.id), filters)
          }
        })
        .then(count => {
          let reader = returnedReader
          let publications = reader.publications.map(pub => {
            return _.pick(pub.toJSON(), [
              'id',
              'name',
              'datePublished',
              'type',
              'encodingFormat',
              'published',
              'updated',
              'resources',
              'tags',
              'shortId',
              'author',
              'editor',
              'bookFormat',
              'inLanguage'
            ])
          })
          res.setHeader('Content-Type', 'application/ld+json')
          res.end(
            JSON.stringify({
              totalItems: parseInt(count),
              items: publications,
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
