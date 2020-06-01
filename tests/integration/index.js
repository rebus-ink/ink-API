const forbiddedTests = require('./auth/forbidden.test')
const unauthorizedTests = require('./auth/unauthorized.test')

const libraryGetTests = require('./library/library-get.test')
const libraryPaginateTests = require('./library/library-paginate.test')
const libraryFilterCollectionTests = require('./library/library-filter-collection.test')
const libraryFilterTagTests = require('./library/library-filter-tag.test')
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
const libraryOrderByTypeTest = require('./library/library-orderBy-type.test')

const noteGetTests = require('./note/note-get.test')
const notePostTests = require('./note/note-post.test')
const noteDeleteTests = require('./note/note-delete.test')
const notePutTests = require('./note/note-put.test')

const sourceGetTests = require('./source/source-get.test')
const sourceDeleteTests = require('./source/source-delete.test')
const sourcePostTests = require('./source/source-post.test')
const sourcePatchTests = require('./source/source-patch.test')
const readActivityPostTests = require('./source/readActivity-post.test')
const sourceBatchUpdateTests = require('./source/source-batchUpdate.test')

const readerCreateTests = require('./reader/reader-post.test')
const readerGetTests = require('./reader/reader-get.test')
const readerPutTests = require('./reader/reader-put.test')
const readerDeleteTests = require('./reader/reader-delete.test')

const readerNotesGetTests = require('./readerNotes/readerNotes-get.test')
const readerNotesPaginateTests = require('./readerNotes/readerNotes-paginate.test')
const readerNotesOrderByTests = require('./readerNotes/readerNotes-orderBy.test')
const readerNotesFilterPubTests = require('./readerNotes/readerNotes-filter-source.test')
const readerNotesFilterMotivationTests = require('./readerNotes/readerNotes-filter-motivation.test')
const readerNotesFilterSearchTests = require('./readerNotes/readerNotes-filter-search.test')
const readerNotesFilterCollectionTests = require('./readerNotes/readerNotes-filter-collection.test')
const readerNotesFilterTagTests = require('./readerNotes/readerNotes-filter-tag.test')
const readerNotesFilterCombinedTests = require('./readerNotes/readerNotes-filter-combined.test')
const readerNotesFilterDateRange = require('./readerNotes/readerNotes-filter-dateRange.test')
const readerNotesFilterFlagTests = require('./readerNotes/readerNotes-filter-flag.test')
const readerNotesFilterDocumentTests = require('./readerNotes/readerNotes-filter-document.test')

const sourceAddTagTests = require('./tag/source-tag-put.test')
const sourceRemoveTagTests = require('./tag/source-tag-delete.test')
const tagsGetTests = require('./tag/tags-get.test')
const tagsPostTests = require('./tag/tag-post.test')
const tagPutTests = require('./tag/tag-put.test')
const tagDeleteTests = require('./tag/tag-delete.test')
const tagNotePutTests = require('./tag/tag-note-put.test')
const tagNoteDeleteTests = require('./tag/tag-note-delete.test')

const noteRelationPostTests = require('./noteRelation/noteRelation-post.test')
const noteRelationPutTests = require('./noteRelation/noteRelation-put.test')
const noteRelationDeleteTests = require('./noteRelation/noteRelation-delete.test')

const noteContextPostTests = require('./noteContext/noteContext-post.test')
const noteContextPutTests = require('./noteContext/noteContext-put.test')
const noteContextDeleteTests = require('./noteContext/noteContext-delete.test')
const noteContextAddNoteTests = require('./noteContext/noteContext-addNote.test')
const noteContextGetTests = require('./noteContext/noteContext-get.test')

const outlineGetTests = require('./outline/outline-get.test')
const outlinePostTests = require('./outline/outline-post.test')
const outlineDeleteTests = require('./outline/outlline-delete.test')
const outlinePutTests = require('./outline/outline-put.test')
const outlineAddNoteTests = require('./outline/outline-addNote.test')
const outlineDeleteNoteTests = require('./outline/outline-deleteNote.test')
const outlinePatchNoteTests = require('./outline/outline-patchNote.test')

const notebookPostTests = require('./notebook/notebook-post.test')
const notebookGetTests = require('./notebook/notebook-get.test')
const notebooksGetTests = require('./notebook/notebooks-get.test')
const notebookPutTests = require('./notebook/notebook-put.test')
const notebookDeleteTests = require('./notebook/notebook-delete.test')
const notebookPubPutTests = require('./notebook/notebook-pub-put.test')
const notebookPubDeleteTests = require('./notebook/notebook-pub-delete.test')
const notebookNotePutTests = require('./notebook/notebook-note-put.test')
const notebookNoteDeleteTests = require('./notebook/notebook-note-delete.test')
const notebookNotePostTests = require('./notebook/notebook-note-post.test')
const notebookTagPutTests = require('./notebook/notebook-tag-put.test')
const notebookTagDeleteTests = require('./notebook/notebook-tag-delete.test')

const hardDeletePubTests = require('./hardDelete/deletePub.test')
const hardDeleteNoteTests = require('./hardDelete/deleteNote.test')
const hardDeleteNotebookTests = require('./hardDelete/deleteNotebook.test')
const hardDeleteTagTests = require('./hardDelete/deleteTag.test')
const hardDeleteReaderTests = require('./hardDelete/deleteReader.test')

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
    try {
      await forbiddedTests(app)
      await unauthorizedTests(app)
    } catch (err) {
      console.log('authentication integration test error: ', err)
    }
  }

  if (!test || test === 'library') {
    try {
      await libraryGetTests(app)
      await libraryPaginateTests(app)
      await libraryFilterCollectionTests(app)
      await libraryFilterTagTests(app)
      await libraryFilterTitleTests(app)
      await libraryFilterAttributionTests(app)
      await libraryFilterLanguageTests(app)
      await libraryFilterTypeTests(app)
      await libraryFilterCombinedTests(app)
      await libraryOrderByDefaultTests(app)
      await libraryOrderByTitleTests(app)
      await libraryOrderByTypeTest(app)
      await libraryOrderByDatePublishedTests(app)
      await libraryFilterKeyword(app)
      await libraryFilterSearch(app)
    } catch (err) {
      console.log('library integration test error: ', err)
    }
  }

  if (!test || test === 'source') {
    try {
      await sourceGetTests(app)
      await sourceDeleteTests(app)
      await sourcePostTests(app)
      await sourcePatchTests(app)
      await readActivityPostTests(app)
      await sourceBatchUpdateTests(app)
    } catch (err) {
      console.log('source integration test error: ', err)
    }
  }

  if (!test || test === 'reader') {
    try {
      await readerCreateTests(app)
      await readerGetTests(app)
      await readerPutTests(app)
      await readerDeleteTests(app)
    } catch (err) {
      console.log('reader integration test error: ', err)
    }
  }

  if (!test || test === 'note') {
    try {
      await noteGetTests(app)
      await notePostTests(app)
      await noteDeleteTests(app)
      await notePutTests(app)
    } catch (err) {
      console.log('note integration test error: ', err)
    }
  }

  if (!test || test === 'tag') {
    try {
      await tagsGetTests(app)
      await sourceAddTagTests(app)
      await sourceRemoveTagTests(app)
      await tagNotePutTests(app)
      await tagNoteDeleteTests(app)
      await tagDeleteTests(app)
      await tagsPostTests(app)
      await tagPutTests(app)
    } catch (err) {
      console.log('tag integration test error: ', err)
    }
  }

  if (!test || test === 'readerNotes') {
    try {
      await readerNotesGetTests(app)
      await readerNotesPaginateTests(app)
      await readerNotesOrderByTests(app)
      // filter
      await readerNotesFilterPubTests(app)
      await readerNotesFilterMotivationTests(app)
      await readerNotesFilterSearchTests(app)
      await readerNotesFilterCollectionTests(app)
      await readerNotesFilterTagTests(app)
      await readerNotesFilterCombinedTests(app)
      await readerNotesFilterDateRange(app)
      await readerNotesFilterFlagTests(app)
      await readerNotesFilterDocumentTests(app)
    } catch (err) {
      console.log('readerNotes integration tests error: ', err)
    }
  }

  if (!test || test === 'noteRelation') {
    try {
      await noteRelationPostTests(app)
      await noteRelationPutTests(app)
      await noteRelationDeleteTests(app)
    } catch (err) {
      console.log('noteRelation integration tests error: ', err)
    }
  }

  if (!test || test === 'noteContext') {
    try {
      await noteContextPostTests(app)
      await noteContextPutTests(app)
      await noteContextDeleteTests(app)
      await noteContextAddNoteTests(app)
      await noteContextGetTests(app)
    } catch (err) {
      console.log('noteContext integration tests error: ', err)
    }
  }

  if (!test || test === 'outline') {
    try {
      await outlineGetTests(app)
      await outlinePostTests(app)
      await outlineDeleteTests(app)
      await outlinePutTests(app)
      await outlineAddNoteTests(app)
      await outlineDeleteNoteTests(app)
      await outlinePatchNoteTests(app)
    } catch (err) {
      console.log('outline integration tests error: ', err)
    }
  }

  if (!test || test === 'notebook') {
    try {
      await notebookPostTests(app)
      await notebookGetTests(app)
      await notebooksGetTests(app)
      await notebookPutTests(app)
      await notebookDeleteTests(app)
      await notebookPubPutTests(app)
      await notebookPubDeleteTests(app)
      await notebookNotePutTests(app)
      await notebookNoteDeleteTests(app)
      await notebookNotePostTests(app)
      await notebookTagPutTests(app)
      await notebookTagDeleteTests(app)
    } catch (err) {
      console.log('notebook integration test error: ', err)
    }
  }

  if (!test || test === 'delete') {
    try {
      await hardDeletePubTests(app)
      await hardDeleteNoteTests(app)
      await hardDeleteNotebookTests(app)
      await hardDeleteTagTests(app)
      await hardDeleteReaderTests(app)
    } catch (err) {
      console.log('hard delete integration test error: ', err)
    }
  }

  await app.knex.migrate.rollback()
  await app.terminate()
}
allTests()
