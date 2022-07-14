const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Note } = require('../../models/Note')
const boom = require('@hapi/boom')
const _ = require('lodash')
const { ValidationError } = require('objection')
const { Tag } = require('../../models/Tag')
const { Note_Tag } = require('../../models/Note_Tag')
const { urlToId } = require('../../utils/utils')
const { Notebook } = require('../../models/Notebook')
const { Notebook_Note } = require('../../models/Notebook_Note')
const {
  notesCacheUpdate,
  tagsCacheUpdate,
  notebooksCacheUpdate
} = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * /notes:
   *   post:
   *     tags:
   *       - notes
   *     description: Create a Note
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - in: query
   *         name: skipDuplicates
   *         schema:
   *           type: boolean
   *           default: false
   *         description: an option to skip creating a Note if it already exists.
   *           This is used in the frontend for note imports to allow for syncing with an existing list of notes.
   *           A duplicate is a note with the same body content and motivation.
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/note-input'
   *     responses:
   *       201:
   *         description: Successfully created Note
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/note-basic-return'
   *       400:
   *         description: Validation error
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: Source (from note.sourceId) not found
   */
  app.use('/', router)
  router.route('/notes').post(jwtAuth, function (req, res, next) {
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
        if (typeof body !== 'object' || _.isEmpty(body)) {
          return next(
            boom.badRequest('Body must be a JSON object', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        let hasDuplicate
        if (req.query.skipDuplicates) {
          hasDuplicate = await Note.checkDuplicates(reader, body)
          if (hasDuplicate) {
            res.status(204).end()
          }
        }

        if (!hasDuplicate) {
        let createdNote
        try {
          createdNote = await Note.createNote(reader, body)
        } catch (err) {
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Create Note: ${err.message}`,
                {
                  requestUrl: req.originalUrl,
                  requestBody: req.body,
                  validation: err.data
                }
              )
            )
          } else if (err.message === 'no source') {
            return next(
              boom.notFound(
                `Create Note Error: No Source found with id: ${body.sourceId}`,
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

        let tags
        if (body.tags) {
          let newTags = body.tags.filter(tag => {
            return !tag.id
          })
          if (newTags) {
            newTags = await Tag.createMultipleTags(
              createdNote.readerId,
              newTags
            )
            await tagsCacheUpdate(reader.authId)
            // await notebooksCacheUpdate(reader.authId)
          }
          tags = body.tags.filter(tag => !!tag.id).concat(newTags)
          let tagIds = tags.map(tag => tag.id)
          await Note_Tag.addMultipleTagsToNote(urlToId(createdNote.id), tagIds)
        }

        let notebooks
        if (body.notebooks) {
          let newNotebooks = body.notebooks.filter(notebook => {
            return !notebook.id
          })
          if (newNotebooks) {
            newNotebooks = await Notebook.createMultipleNotebooks(
              createdNote.readerId,
              newNotebooks
            )
            // await notebooksCacheUpdate(reader.authId)
          }
          notebooks = body.notebooks
            .filter(notebook => !!notebook.id)
            .concat(newNotebooks)
          let notebookIds = notebooks.map(notebook => notebook.id)
          await Notebook_Note.addMultipleNotebooksToNote(
            urlToId(createdNote.id),
            notebookIds
          )
          if (notebooks.length) {
            await Notebook_Note.updateSource(
              notebookIds.join(),
              urlToId(createdNote.id)
            )
          }
        }

        await notesCacheUpdate(reader.authId)
        await notebooksCacheUpdate(reader.authId)

        res.setHeader('Content-Type', 'application/ld+json')
        res.setHeader('Location', createdNote.id)
        res.status(201).end(JSON.stringify(createdNote.toJSON()))
      }
      })
      .catch(err => {
        next(err)
      })
    
  })
}
