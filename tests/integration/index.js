const forbiddedTests = require('./auth/forbidden.test')
const unauthorizedTests = require('./auth/unauthorized.test')

const libraryGetTests = require('./library/library-get.test')
const libraryPaginateTests = require('./library/library-paginate.test')
const libraryFilterCollectionTests = require('./library/library-filter-collection.test')
const libraryFilterWorkspaceTests = require('./library/library-filter-workspace.test')
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

const noteGetTests = require('./note/note-get.test')
const notePostTests = require('./note/note-post.test')
const noteDeleteTests = require('./note/note-delete.test')
const notePutTests = require('./note/note-put.test')

const publicationGetTests = require('./publication/publication-get.test')
const publicationDeleteTests = require('./publication/publication-delete.test')
const publicationPostTests = require('./publication/publication-post.test')
const publicationPatchTests = require('./publication/publication-patch.test')
const readActivityPostTests = require('./publication/readActivity-post.test')

const readerCreateTests = require('./reader/reader-post.test')
const readerGetTests = require('./reader/reader-get.test')

const readerNotesGetTests = require('./readerNotes/readerNotes-get.test')
const readerNotesPaginateTests = require('./readerNotes/readerNotes-paginate.test')
const readerNotesOrderByTests = require('./readerNotes/readerNotes-orderBy.test')
const readerNotesFilterPubTests = require('./readerNotes/readerNotes-filter-publication.test')
const readerNotesFilterDocTests = require('./readerNotes/readerNotes-filter-document.test')
const readerNotesFilterMotivationTests = require('./readerNotes/readerNotes-filter-motivation.test')
const readerNotesFilterSearchTests = require('./readerNotes/readerNotes-filter-search.test')
const readerNotesFilterCollectionTests = require('./readerNotes/readerNotes-filter-collection.test')
const readerNotesFilterWorkspaceTests = require('./readerNotes/readerNotes-filter-workspace.test')
const readerNotesFilterCombinedTests = require('./readerNotes/readerNotes-filter-combined.test')
const readerNotesFilterDateRange = require('./readerNotes/readerNotes-filter-dateRange.test')

const publicationAddTagTests = require('./tag/publication-tag-put.test')
const publicationRemoveTagTests = require('./tag/publication-tag-delete.test')
const tagsGetTests = require('./tag/tags-get.test')
const tagsPostTests = require('./tag/tag-post.test')
const tagPutTests = require('./tag/tag-put.test')
const tagDeleteTests = require('./tag/tag-delete.test')
const tagNotePutTests = require('./tag/tag-note-put.test')
const tagNoteDeleteTests = require('./tag/tag-note-delete.test')

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

  if (!test || test === 'auth') {
    await forbiddedTests(app)
    await unauthorizedTests(app)
  }

  if (!test || test === 'library') {
    await libraryGetTests(app)
    await libraryPaginateTests(app)
    await libraryFilterCollectionTests(app)
    await libraryFilterWorkspaceTests(app)
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
  }

  if (!test || test === 'publication') {
    await publicationGetTests(app)
    await publicationDeleteTests(app)
    await publicationPostTests(app)
    await publicationPatchTests(app)
    await readActivityPostTests(app)
  }

  if (!test || test === 'reader') {
    await readerCreateTests(app)
    await readerGetTests(app)
  }

  if (!test || test === 'note') {
    await noteGetTests(app)
    await notePostTests(app)
    await noteDeleteTests(app)
    await notePutTests(app)
  }

  if (!test || test === 'tag') {
    await tagsGetTests(app)
    await publicationAddTagTests(app)
    await publicationRemoveTagTests(app)
    await tagNotePutTests(app)
    await tagNoteDeleteTests(app)
    await tagDeleteTests(app)
    await tagsPostTests(app)
    await tagPutTests(app)
  }

  if (!test || test === 'readerNotes') {
    await readerNotesGetTests(app)
    await readerNotesPaginateTests(app)
    await readerNotesOrderByTests(app)
    // filter
    await readerNotesFilterPubTests(app)
    await readerNotesFilterDocTests(app)
    await readerNotesFilterMotivationTests(app)
    await readerNotesFilterSearchTests(app)
    await readerNotesFilterCollectionTests(app)
    await readerNotesFilterWorkspaceTests(app)
    await readerNotesFilterCombinedTests(app)
    await readerNotesFilterDateRange(app)
  }

  if (!test || test === 'jobs') {
    await jobGetTests(app)
  }

  await app.knex.migrate.rollback()
  await app.terminate()
}
allTests()
