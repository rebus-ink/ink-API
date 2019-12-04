const activityTests = require('./Activity.test')
const documentTests = require('./Document.test')
const publicationTests = require('./Publication.test')
const readerTests = require('./Reader.test')
const noteTests = require('./Note.test')
const tagTests = require('./Tag.test')
const readActivityTests = require('./ReadActivity.test')
const attributionTests = require('./Attribution.test')
const jobTests = require('./Job.test')

const app = require('../../server').app

require('dotenv').config()

// reset database:
// sudo -u postgres psql -c "drop database ink_test;"
// sudo -u postgres psql -c "create database ink_test;"
// knex migrate:latest --env=postgresql

// note: after new migration, remove 'true' from app.initialize and comment out rollback. Run models test once.

const allTests = async () => {
  await app.initialize(true)
  await app.knex.migrate.rollback()
  if (process.env.POSTGRE_DB === 'travis_ci_test') {
    await app.knex.migrate.latest()
  }

  await activityTests(app)
  await documentTests(app)
  await publicationTests(app)
  await attributionTests(app)
  await readerTests(app)
  await noteTests(app)
  await tagTests(app)
  await readActivityTests(app)
  await jobTests(app)

  await app.knex.migrate.rollback()
  await app.terminate()
}

allTests()
