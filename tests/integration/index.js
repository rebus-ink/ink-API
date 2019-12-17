const activityCreateTests = require('./activity-create.test')
const activityGetTests = require('./activity-get.test')
const readActivityCreateTests = require('./readActivity-create.test')

const authErrorTests = require('./auth-error.test')

const libraryGetTests = require('./library-get.test')
const libraryPaginateTests = require('./library-paginate.test')
const libraryFilterCollectionTests = require('./library-filter-collection.test')
const libraryFilterTitleTests = require('./library-filter-title.test')
const libraryFilterAttributionTests = require('./library-filter-attribution.test')
const libraryFilterLanguageTests = require('./library-filter-language.test')
const libraryFilterCombinedTests = require('./library-filter-combined.test')
const libraryOrderByDefaultTests = require('./library-orderBy-default.test')
const libraryOrderByTitleTests = require('./library-orderBy-title.test')
const libraryOrderByDatePublishedTests = require('./library-orderBy-datePublished.test')
const libraryFilterTestsOld = require('./library-filter-old.test') // derepcated
const libraryGetTestsOld = require('./library-get-old.test') // deprecated
const libraryOrderByTestsOld = require('./library-orderBy-old.test') // deprecated
const libraryPaginateTestsOld = require('./library-paginate-old.test') // deprecated

const noteCreateTests = require('./note-create.test')
const noteGetTests = require('./note-get.test')
const noteUpdateTests = require('./note-update.test')
const noteDeleteTests = require('./note-delete.test')

const outboxGetTests = require('./outbox-get.test')

const publicationGetTests = require('./publication-get.test')
const publicationUpdateTests = require('./publication-update.test')
const publicationDeleteTestsOld = require('./publication-delete-old.test')
const publicationDeleteTests = require('./publication-delete.test')
const publicationPostTests = require('./publication-post.test')
const publicationPatchTests = require('./publication-patch.test')

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
const publicationAddTagTests = require('./publication-tag.test')
const tagsGetTests = require('./tags-get.test')

const jobGetTests = require('./job-get.test')

const app = require('../../server').app

require('dotenv').config()

const allTests = async () => {
  await app.initialize(true)
  await app.knex.migrate.rollback()
  if (process.env.POSTGRE_DB === 'travis_ci_test') {
    await app.knex.migrate.latest()
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
    await libraryFilterCollectionTests(app)
    await libraryFilterTitleTests(app)
    await libraryFilterAttributionTests(app)
    await libraryFilterLanguageTests(app)
    await libraryFilterCombinedTests(app)
    await libraryOrderByDefaultTests(app)
    await libraryOrderByTitleTests(app)
    await libraryOrderByDatePublishedTests(app)

    // deprecated:
    await libraryFilterTestsOld(app)
    await libraryGetTestsOld(app)
    await libraryOrderByTestsOld(app)
    await libraryPaginateTestsOld(app)
  }

  if (!test || test === 'outbox') await outboxGetTests(app)

  if (!test || test === 'publication') {
    await publicationGetTests(app)
    await publicationUpdateTests(app) // deprecated
    await publicationDeleteTests(app)
    await publicationDeleteTestsOld(app) // deprecated
    await publicationPostTests(app)
    await publicationPatchTests(app)
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
    await tagsGetTests(app)
    await publicationAddTagTests(app)
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

  await app.knex.migrate.rollback()
  await app.terminate()
}
allTests()
