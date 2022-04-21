const express = require('express')
const router = express.Router()
const { Note } = require('../../models/Note')
const { notesToDocx } = require('../../utils/notesDocx')
const boom = require('@hapi/boom')
const { Packer } = require('docx')
const fs = require('fs')

module.exports = app => {
  app.use('/', router)

  /**
   * @swagger
   * /notes/docx:
   *   get:
   *     tags:
   *       - outlines
   *     description: POST /notes/docx
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A docx document for list of notes
   *       401:
   *         desription: 'No Authentication'
   */

  router.post(
    '/notes/docx',
    // passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const noteIds = req.body.notes
      Note.byIds(noteIds)
        .then(async notes => {
          if (
            !notes
          ) {
            return next(
              boom.notFound(
                `Get notes Error: No Notes found with ids ${noteIds}`,
                {
                  requestUrl: req.originalUrl
                }
              )
            )
          }

          const listOfNotes = notesToDocx(notes)

          const b64string = await Packer.toBase64String(listOfNotes)

          res.set(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          )
          res.set(
            'Content-Disposition',
            `attachment; filename=${fileName}.docx`
          )
          res.send(Buffer.from(b64string, 'base64'))
        })
        .catch(err => {
          next(err)
        })
    }
  )
}
