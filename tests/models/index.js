const sourceTests = require('./Source.test')
const readerTests = require('./Reader.test')
const noteTests = require('./Note.test')
const tagTests = require('./Tag.test')
const readActivityTests = require('./ReadActivity.test')
// const attributionTests = require('./Attribution.test')
const noteBodyTests = require('./NoteBody.test')
const outlineDataTests = require('./OutlineData.test')
// const noteContextTests = require('./NoteContext.test')
const noteRelationTests = require('./NoteRelation.test')
const notebookTests = require('./Notebook.test')
const notebookTagTests = require('./Notebook_Tag.test')
const notebookPubTests = require('./Notebook_Pub.test')
const notebookNoteTests = require('./Notebook_Note.test')
const noteTagTests = require('./Note_Tag.test')
const sourceTagTests = require('./Source_Tag.test')
const collaboratorTests = require('./Collaborator.test')

const app = require('../../server').app

require('dotenv').config()

// reset database:
// sudo -u postgres psql -c "drop database ink_test;"
// sudo -u postgres psql -c "create database ink_test;"
// knex migrate:latest

// NOTE: after new migration, remove 'true' from app.initialize and comment out rollback. Run models test once.

const allTests = async () => {
  await app.initialize(true)
  await app.knex.migrate.rollback()

  await sourceTests(app)
  // await attributionTests(app) // skipped for now. need to fix create attribution tests

  await readerTests(app)
  await noteTests(app)
  await noteBodyTests(app)
  await tagTests(app)
  await readActivityTests(app)

  // await noteContextTests(app)

  await noteRelationTests(app)
  await notebookTests(app)
  await notebookTagTests(app)
  await notebookPubTests(app)
  await notebookNoteTests(app)
  await noteTagTests(app)
  await sourceTagTests(app)
  await outlineDataTests(app)
  await collaboratorTests(app)

  await app.knex.migrate.rollback()
  await app.terminate()
}

allTests()
