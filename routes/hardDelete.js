const express = require('express')
const router = express.Router()
const { Source } = require('../models/Source')
const { Note } = require('../models/Note')
const { Notebook } = require('../models/Notebook')
const { NoteContext } = require('../models/NoteContext')
const { Tag } = require('../models/Tag')
const { Reader } = require('../models/Reader')
const { NoteRelation } = require('../models/NoteRelation')
const { NoteBody } = require('../models/NoteBody')
const { Attribution } = require('../models/Attribution')
const { urlToId } = require('../utils/utils')
const { Canvas } = require('../models/Canvas')

const timestamp = new Date(Date.now() - 86400 * 1000).toISOString()

module.exports = function (app) {
  app.use('/', router)
  router.route('/hardDelete').delete(async function (req, res) {
    if (
      process.env.NODE_ENV === 'test' ||
      req.connection.remoteAddress === '10.0.0.1'
    ) {
      await Source.query()
        .delete()
        .where('deleted', '<', timestamp)
      await Attribution.query()
        .delete()
        .where('deleted', '<', timestamp)
      await Note.query()
        .delete()
        .where('deleted', '<', timestamp)
      await NoteBody.query()
        .delete()
        .where('deleted', '<', timestamp)
      await NoteRelation.query()
        .delete()
        .where('deleted', '<', timestamp)
      await Notebook.query()
        .delete()
        .where('deleted', '<', timestamp)
      await Canvas.query()
        .delete()
        .where('deleted', '<', timestamp)
      await NoteContext.query()
        .delete()
        .where('deleted', '<', timestamp)
      await Tag.query()
        .delete()
        .where('deleted', '<', timestamp)
      await Reader.query()
        .delete()
        .where('deleted', '<', timestamp)

      // referenced sources
      await Source.query()
        .where('referenced', '<', timestamp)
        .patch({
          links: null,
          readingOrder: null,
          resources: null
        })
      // emptied notes
      const emptiedNotes = await Note.query().where('emptied', '<', timestamp)

      const emptiedNotesIds = emptiedNotes.map(note => urlToId(note.id))

      await NoteBody.query()
        .delete()
        .whereIn('noteId', emptiedNotesIds)

      await Note.query()
        .patch({
          stylesheet: null,
          canonical: null,
          target: null,
          document: null,
          json: null
        })
        .whereIn('id', emptiedNotesIds)

      res.status(204).end()
    } else {
      res.status(403)
    }
  })
}
