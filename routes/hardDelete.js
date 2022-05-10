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
const { fileDeleteQueue } = require('../utils/file-delete')

const timestamp = new Date(Date.now() - 86400 * 1000).toISOString()

module.exports = function (app) {
  app.use('/', router)
  router.route('/hardDelete').delete(async function (req, res) {
    if (
      process.env.NODE_ENV === 'test' ||
      req.connection.remoteAddress === '10.0.0.1'
    ) {
      // get list of deleted / referenced sources
      const sourcesToDelete = await Source.query()
        .where('deleted', '<', timestamp)
        .orWhere('referenced', '<', timestamp)
      sourcesToDelete.forEach(source => {
        let storageId
        if (source.json) {
          storageId = source.json.storageId
        }
        if (fileDeleteQueue) {
          fileDeleteQueue.add({
            readerId: urlToId(source.readerId),
            storageId,
            bucket: process.env.GOOGLE_STORAGE_BUCKET
          })
        }

      })

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
          resources: null,
          abstract: null,
          description: null,
          wordCount: null,
          status: null,
          encodingFormat: null,
          'metadata:keywords': null,
          'metadata:url': null,
          'metadata:dateModified': null,
          'metadata:bookFormat': null,
          'metadata:copyrightYear': null,
          'metadata:genre': null,
          'metadata:license': null,
          'metadata:inDirection': null
        })

      res.status(204).end()
    } else {
      res.status(403)
    }
  })
}
