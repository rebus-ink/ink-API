const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../../models/Reader')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Note } = require('../../models/Note')
const boom = require('@hapi/boom')
const { checkOwnership, urlToId } = require('../../utils/utils')
const { NoteContext } = require('../../models/NoteContext')
const debug = require('debug')('ink:routes:outline-deleteNote')

module.exports = function (app) {
  /**
   * @swagger
   * /outlines/:id/notes/:noteId:
   *   delete:
   *     tags:
   *       - outlines
   *     description: Add a Note to a NoteContext
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *       - in: path
   *         name: noteId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     responses:
   *       204:
   *         description: Successfully deleted Note in Outline
   *       401:
   *         description: 'No Authentication'
   *       403:
   *         description: 'Access to reader {id} disallowed'
   *       404:
   *         description: 'Outline or Note not found'
   */
  app.use('/', router)
  router
    .route('/outlines/:id/notes/:noteId')
    .delete(jwtAuth, function (req, res, next) {
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
          if (!checkOwnership(reader.id, req.params.id)) {
            return next(
              boom.forbidden(`Access to Outline ${req.params.id} disallowed`, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }
          if (!checkOwnership(reader.id, req.params.noteId)) {
            return next(
              boom.forbidden(`Access to Note ${req.params.noteId} disallowed`, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }

          const outlineExists = await NoteContext.checkIfExists(req.params.id)
          debug('outline exists? ', outlineExists)
          if (!outlineExists) {
            return next(
              boom.notFound(`No Outline found with id ${req.params.id}`, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }

          // get Note
          const note = await Note.byId(req.params.noteId)
          debug('note to be deleted: ', note)
          if (!note || note.deleted) {
            return next(
              boom.notFound(`No Note found with id: ${req.params.noteId}`, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }
          if (note.contextId !== req.params.id) {
            return next(
              boom.badRequest(
                `Note ${req.params.noteId} does not belong to outline ${
                  req.params.id
                }`,
                {
                  requestUrl: req.originalUrl,
                  requestBody: req.body
                }
              )
            )
          }

          // linked list adjustments
          if (note.previous) {
            debug('previous note: ', note.previous)
            const previousNote = await Note.byId(note.previous)
            await Note.update(
              Object.assign(previousNote, { next: urlToId(note.next) })
            )
          }
          if (note.next) {
            debug('next note: ', note.next)
            const nextNote = await Note.byId(note.next)
            await Note.update(
              Object.assign(nextNote, { previous: urlToId(note.previous) })
            )
          }

          try {
            await Note.delete(req.params.noteId)
          } catch (err) {
            debug('deleting error: ', err.message)
            return next(
              boom.badRequest(err.message, {
                requestUrl: req.originalUrl,
                requestBody: req.body
              })
            )
          }

          res.setHeader('Content-Type', 'application/ld+json')
          res.status(204).end()
        })
        .catch(err => {
          next(err)
        })
    })
}
