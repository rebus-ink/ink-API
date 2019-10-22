const activityCreateTests = require('./activity-create.test')
const activityGetTests = require('./activity-get.test')
const readActivityCreateTests = require('./readActivity-create.test')

const authErrorTests = require('./auth-error.test')

const libraryGetTests = require('./library-get.test')
const libraryPaginateTests = require('./library-paginate.test')
const libraryFilterTests = require('./library-filter.test')
const libraryOrderByTests = require('./library-orderBy.test')

const noteCreateTests = require('./note-create.test')
const noteGetTests = require('./note-get.test')
const noteUpdateTests = require('./note-update.test')
const noteDeleteTests = require('./note-delete.test')

const outboxGetTests = require('./outbox-get.test')

const publicationGetTests = require('./publication-get.test')
const publicationUpdateTests = require('./publication-update.test')
const publicationDeleteTests = require('./publication-delete.test')

const readerCreateTests = require('./reader-create.test')
const readerGetTests = require('./reader-get.test')

const readerNotesGetTests = require('./readerNotes-get.test')
const readerNotesPaginateTests = require('./readerNotes-paginate.test')
const readerNotesFilterTests = require('./readerNotes-filter.test')
const readerNotesOrderByTests = require('./readerNotes-orderBy.test')

const tagCreateTests = require('./tag-create.test')
const tagPublicationTests = require('./tag-publication.test')
const tagNoteTests = require('./tag-note.test')
const tagDeleteTests = require('./tag-delete.test')
const tagUpdateTests = require('./tag-update.test')

const jobGetTests = require('./job-get.test')

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

  if (!test || test === 'activity') {
    await activityCreateTests(app)
    await activityGetTests(app)
    await readActivityCreateTests(app)
  }
  if (!test || test === 'auth') await authErrorTests(app)

  if (!test || test === 'library') {
    await libraryGetTests(app)
    await libraryPaginateTests(app)
    await libraryFilterTests(app)
    await libraryOrderByTests(app)
  }

  if (!test || test === 'outbox') await outboxGetTests(app)

  if (!test || test === 'publication') {
    await publicationGetTests(app)
    await publicationUpdateTests(app)
    await publicationDeleteTests(app)
  }

  if (!test || test === 'reader') {
    await readerCreateTests(app)
    await readerGetTests(app)
  }

  if (!test || test === 'note') {
    await noteCreateTests(app)
    await noteGetTests(app)
    await noteUpdateTests(app)
    await noteDeleteTests(app)
  }

  if (!test || test === 'tag') {
    await tagCreateTests(app)
    await tagPublicationTests(app)
    await tagNoteTests(app)
    await tagDeleteTests(app)
    await tagUpdateTests(app)
  }

  if (!test || test === 'readerNotes') {
    await readerNotesGetTests(app)
    await readerNotesPaginateTests(app)
    await readerNotesFilterTests(app)
    await readerNotesOrderByTests(app)
  }

  if (!test || test === 'jobs') {
    await jobGetTests(app)
  }

  if (process.env.POSTGRE_INSTANCE) {
    await app.knex.migrate.rollback()
    await app.terminate()
  }
}

allTests()
