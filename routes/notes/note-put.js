const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const boom = require('@hapi/boom')
const { checkOwnership, urlToId } = require('../../utils/utils')
const { Note } = require('../../models/Note')
const { Tag } = require('../../models/Tag')
const { Note_Tag } = require('../../models/Note_Tag')
const { ValidationError } = require('objection')
const { Notebook } = require('../../models/Notebook')
const { Notebook_Note } = require('../../models/Notebook_Note')
const { notesCacheUpdate, notebooksCacheUpdate } = require('../../utils/cache')

module.exports = function (app) {
  /**
   * @swagger
   * /notes/{noteId}:
   *   put:
   *     tags:
   *       - notes
   *     description: Update a Note
   *     parameters:
   *       - in: path
   *         name: noteId
   *         schema:
   *           type: string
   *         required: true
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/note-input'
   *     security:
   *       - Bearer: []
   *     responses:
   *       200:
   *         description: Successfully updated Note
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/note-basic-return'
   *       400:
   *         description: 'Validation Error'
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to Note {noteId} disallowed'
   *       404:
   *         description: No note found with id {noteId}
   */
  app.use('/', router)
  router.route('/notes/:noteId').put(jwtAuth, function (req, res, next) {
    const noteId = req.params.noteId
    Reader.byAuthId(req.user)
      .then(async reader => {
        if (!reader || reader.deleted) {
          return next(
            boom.notFound('No reader found with this token', {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }
        if (!checkOwnership(reader.id, noteId)) {
          return next(
            boom.forbidden(`Access to Note ${noteId} disallowed`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        const note = Object.assign(req.body, { id: urlToId(noteId) })
        note.readerId = reader.id
        let updatedNote
        try {
          updatedNote = await Note.update(note)
        } catch (err) {
          if (err instanceof ValidationError) {
            return next(
              boom.badRequest(
                `Validation Error on Update Note: ${err.message}`,
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

        if (updatedNote === null) {
          return next(
            boom.notFound(`Put Note Error: No Note found with id ${noteId}`, {
              requestUrl: req.originalUrl,
              requestBody: req.body
            })
          )
        }

        if (req.body.tags) {
          let newTags = req.body.tags.filter(tag => {
            return !tag.id
          })
          if (newTags) {
            newTags = await Tag.createMultipleTags(
              updatedNote.readerId,
              newTags
            )
          }
          let tags = req.body.tags.filter(tag => !!tag.id).concat(newTags)
          let tagIds = tags.map(tag => tag.id)
          await Note_Tag.replaceTagsForNote(urlToId(updatedNote.id), tagIds)
        }

        if (req.body.notebooks) {
          let newNotebooks = req.body.notebooks.filter(notebook => {
            return !notebook.id
          })
          if (newNotebooks.length) {
            newNotebooks = await Notebook.createMultipleNotebooks(
              updatedNote.readerId,
              newNotebooks
            )
          }
          let notebooks = req.body.notebooks
            .filter(notebook => !!notebook.id)
            .concat(newNotebooks)
          let notebookIds = notebooks.map(notebook => urlToId(notebook.id))
          await Notebook_Note.replaceNotebooksForNote(
            urlToId(updatedNote.id),
            notebookIds
          )
          if (notebooks.length) {
            await Notebook_Note.updateSource(
              notebookIds.join(),
              urlToId(updatedNote.id)
            )
          }

          // todo: add notebooks cache update
        }

        await notesCacheUpdate(reader.authId)
        await notebooksCacheUpdate(reader.authId)
        res.setHeader('Content-Type', 'application/ld+json')
        res.status(200).end(JSON.stringify(updatedNote.toJSON()))
      })

      .catch(err => {
        next(err)
      })
  })
}
