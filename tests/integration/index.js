const activityCreateTests = require('./deprecated/activity-create.test')
const activityGetTests = require('./deprecated/activity-get.test')
const readActivityCreateTests = require('./readActivity-create.test')

const forbiddedTests = require('./auth/forbidden.test')
const unauthorizedTests = require('./auth/unauthorized.test')

const libraryGetTests = require('./library/library-get.test')
const libraryPaginateTests = require('./library/library-paginate.test')
const libraryFilterCollectionTests = require('./library/library-filter-collection.test')
const libraryFilterTitleTests = require('./library/library-filter-title.test')
const libraryFilterAttributionTests = require('./library/library-filter-attribution.test')
const libraryFilterLanguageTests = require('./library/library-filter-language.test')
const libraryFilterTypeTests = require('./library/library-filter-type.test')
const libraryFilterKeyword = require('./library/library-filter-keyword.test')
const libraryFilterSearch = require('./library/library-filter-search.test')
const libraryFilterCombinedTests = require('./library/library-filter-combined.test')
const libraryOrderByDefaultTests = require('./library/library-orderBy-default.test')
const libraryOrderByTitleTests = require('./library/library-orderBy-title.test')
const libraryOrderByDatePublishedTests = require('./library/library-orderBy-datePublished.test')
const libraryFilterTestsOld = require('./deprecated/library-filter-old.test') // derepcated
const libraryGetTestsOld = require('./deprecated/library-get-old.test') // deprecated
const libraryOrderByTestsOld = require('./deprecated/library-orderBy-old.test') // deprecated
const libraryPaginateTestsOld = require('./deprecated/library-paginate-old.test') // deprecated

const noteCreateTests = require('./note-create.test')
const noteGetOldTests = require('./deprecated/note-get.test') // deprecated
const noteGetTests = require('./note/note-get.test')
const noteUpdateTests = require('./note-update.test')
const noteDeleteTests = require('./note-delete.test')

const outboxGetTests = require('./deprecated/outbox-get.test')

const publicationGetTests = require('./publication/publication-get.test')
const publicationUpdateTests = require('./deprecated/publication-update.test')
const publicationDeleteTestsOld = require('./deprecated/publication-delete-old.test')
const publicationDeleteTests = require('./publication/publication-delete.test')
const publicationPostTests = require('./publication/publication-post.test')
const publicationPatchTests = require('./publication/publication-patch.test')

const readerCreateTests = require('./reader/reader-post.test')
const readerGetTests = require('./reader/reader-get.test')
const readerGetTestsOld = require('./deprecated/reader-get-old.test') // deprecated

const readerNotesGetTests = require('./readerNotes/readerNotes-get.test')
const readerNotesGetOldTests = require('./deprecated/readerNotes-get.test') // deprecated
const readerNotesFilterOldTests = require('./deprecated/readerNotes-filter.test') // deprecated
const readerNotesPaginateTests = require('./readerNotes/readerNotes-paginate.test')
const readerNotesFilterTests = require('./readerNotes/readerNotes-filter.test')
const readerNotesOrderByOldTests = require('./deprecated/readerNotes-orderBy.test') // deprecated
const readerNotesPaginateOldTests = require('./deprecated/readerNotes-paginate.test') // deprecated
const readerNotesOrderByTests = require('./readerNotes/readerNotes-orderBy.test')

const tagCreateTests = require('./tag/tag-create.test') // deprecated
const tagPublicationTests = require('./deprecated/tag-publication.test') // deprecated
const tagNoteTests = require('./deprecated/tag-note.test') // deprecated
const tagDeleteTestsOld = require('./deprecated/tag-delete-old.test') // deprecated
const tagUpdateTests = require('./deprecated/tag-update.test') // deprecated
const publicationAddTagTests = require('./tag/publication-tag.test')
const tagsGetTests = require('./tag/tags-get.test')
const tagsPostTests = require('./tag/tag-post.test')
const tagPatchTests = require('./tag/tag-patch.test')
const tagDeleteTests = require('./tag/tag-delete.test')
const tagNotePostTests = require('./tag/tag-note-put.test')

const jobGetOldTests = require('./deprecated/job-get-old.test') // deprecated
const jobGetTests = require('./job/job-get.test')

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
    await activityCreateTests(app) // deprecated
    await activityGetTests(app) // deprecated
    await readActivityCreateTests(app) // deprecated
  }
  if (!test || test === 'auth') {
    await forbiddedTests(app)
    await unauthorizedTests(app)
  }

  if (!test || test === 'library') {
    // updated
    await libraryGetTests(app)
    await libraryPaginateTests(app)
    await libraryFilterCollectionTests(app)
    await libraryFilterTitleTests(app)
    await libraryFilterAttributionTests(app)
    await libraryFilterLanguageTests(app)
    await libraryFilterTypeTests(app)
    await libraryFilterCombinedTests(app)
    await libraryOrderByDefaultTests(app)
    await libraryOrderByTitleTests(app)
    await libraryOrderByDatePublishedTests(app)
    await libraryFilterKeyword(app)
    await libraryFilterSearch(app)

    // deprecated:
    await libraryFilterTestsOld(app)
    await libraryGetTestsOld(app)
    await libraryOrderByTestsOld(app)
    await libraryPaginateTestsOld(app)
  }

  if (!test || test === 'outbox') await outboxGetTests(app) // deprecated

  if (!test || test === 'publication') {
    await publicationGetTests(app) // new
    await publicationUpdateTests(app) // deprecated
    await publicationDeleteTests(app) // new
    await publicationDeleteTestsOld(app) // deprecated
    await publicationPostTests(app) // new
    await publicationPatchTests(app) // new
  }

  if (!test || test === 'reader') {
    await readerGetTestsOld(app) // deprecated
    await readerCreateTests(app)
    await readerGetTests(app) // new
  }

  if (!test || test === 'note') {
    await noteCreateTests(app)
    await noteGetTests(app)
    await noteUpdateTests(app)
    await noteDeleteTests(app)
    await noteGetOldTests(app) // deprecated
  }

  if (!test || test === 'tag') {
    await tagsGetTests(app)
    await publicationAddTagTests(app)
    await tagCreateTests(app) // deprecated
    await tagPublicationTests(app) // deprecated
    await tagNoteTests(app) // deprecated
    await tagNotePostTests(app) // new
    await tagDeleteTests(app) // new
    await tagDeleteTestsOld(app) // deprecated
    await tagUpdateTests(app) // deprecated
    await tagsPostTests(app) // new
    await tagPatchTests(app) // new
  }

  if (!test || test === 'readerNotes') {
    await readerNotesGetTests(app)
    await readerNotesGetOldTests(app) // deprecated
    await readerNotesFilterOldTests(app) // deprecated
    await readerNotesOrderByOldTests(app) // deprecated
    await readerNotesPaginateOldTests(app) // deprecated
    await readerNotesPaginateTests(app)
    await readerNotesFilterTests(app)
    await readerNotesOrderByTests(app)
  }

  if (!test || test === 'jobs') {
    await jobGetTests(app)
    await jobGetOldTests(app) // deprecated
  }

  await app.knex.migrate.rollback()
  await app.terminate()
}
allTests()
