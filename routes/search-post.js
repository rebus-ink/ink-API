const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Library } = require('../models/library')
const { Source } = require('../models/Source')
const { Note } = require('../models/Note')
const { Notebook } = require('../models/Notebook')
const { Reader } = require('../models/Reader')

const boom = require('@hapi/boom')
const { urlToId } = require('../utils/utils')
const _ = require('lodash')

module.exports = app => {
  /**
   * @swagger
   * /search:
   *   post:
   *     tags:
   *       - search
   *     description: send search option objects and get search results back
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Search result object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/search'
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: 'No Reader with ID {id}'
   */
  app.use('/', router)
  router.post(
    '/search',
    passport.authenticate('jwt', { session: false }),
    async function (req, res, next) {
      // get user
      const reader = await Reader.byAuthId(req.user)
      let result = {}

      if (req.body.includeSources) {
        let sources = await Source.search(
          reader.id,
          req.body.search,
          req.body.sources
        )
        sources = sources.map(source => source.toJSON())
        const totalItems = await Source.searchCount(
          reader.id,
          req.body.search,
          req.body.sources
        )
        result.sources = { items: sources, totalItems }
      }

      if (req.body.includeNotes) {
        const notes = await Note.search(
          reader.id,
          req.body.search,
          req.body.notes
        )
        const totalItems = await Note.searchCount(
          reader.id,
          req.body.search,
          req.body.notes
        )
        result.notes = { items: notes, totalItems }
      }

      if (req.body.includeNotebooks) {
        let options = req.body.notebooks
        let limit = options && options.limit ? options.limit : 50
        let page = options && options.page ? options.page : 1
        let offset = page * limit - limit
        // default
        let filters = {
          search: req.body.search,
          name: true,
          description: true
        }
        if (req.body.notebooks && req.body.notebooks.name === false) { filters.name = false }
        if (req.body.notebooks && req.body.notebooks.description === false) { filters.description = false }

        const notebooks = await Notebook.byReader(
          reader.id,
          limit,
          offset,
          filters
        )
        const totalItems = await Notebook.count(reader.id, filters)
        result.notebooks = { items: notebooks, totalItems }
      }

      res.send(result)
      // .catch(err => {
      //   next(err)
      // })
    }
  )
}
