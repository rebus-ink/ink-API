const express = require('express')
const router = express.Router()
const passport = require('passport')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Publication } = require('../models/Publication')
const boom = require('@hapi/boom')
const { checkOwnership } = require('../utils/utils')
const { libraryCacheUpdate } = require('../utils/cache')
const { Note } = require('../models/Note')
const { Notebook } = require('../models/Notebook')
const { NoteContext } = require('../models/NoteContext')
const { Tag } = require('../models/Tag')

const timestamp = new Date(Date.now() - 86400 * 1000).toISOString()

module.exports = function (app) {
  app.use('/', router)
  router.route('/hardDelete').delete(async function (req, res, next) {
    await Publication.query()
      .delete()
      .where('deleted', '<', timestamp)
    await Note.query()
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

    res.status(204).end()
  })
}
