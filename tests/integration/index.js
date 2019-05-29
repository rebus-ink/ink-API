const activityTests = require('./activity.test')
const authErrorTests = require('./auth-error.test')
const libraryTests = require('./library.test')
const outboxTests = require('./outbox.test')
const publicationTests = require('./publication.test')
const readerTests = require('./reader.test')
const noteTests = require('./note.test')
const tagTests = require('./tag.test')
const readerNotesTests = require('./reader-notes.test')

const app = require('../../server').app

require('dotenv').config()

const allTests = async () => {
  if (process.env.POSTGRE_INSTANCE) {
    await app.initialize(true)
    await app.knex.migrate.rollback()
    if (process.env.POSTGRE_DB === 'travis_ci_test') {
      await app.knex.migrate.latest()
    }
  }

  const test = process.env.npm_config_test

  if (!test || test === 'activity') await activityTests(app)
  if (!test || test === 'auth') await authErrorTests(app)
  if (!test || test === 'library') await libraryTests(app)
  if (!test || test === 'outbox') await outboxTests(app)
  if (!test || test === 'publication') await publicationTests(app)
  if (!test || test === 'reader') await readerTests(app)
  if (!test || test === 'note') await noteTests(app)
  if (!test || test === 'tag') await tagTests(app)
  if (!test || test === 'readerNotes') await readerNotesTests(app)

  if (process.env.POSTGRE_INSTANCE) {
    await app.knex.migrate.rollback()
    await app.terminate()
  }
}

allTests()
