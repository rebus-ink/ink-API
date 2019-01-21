const activityTests = require('./activity.test')
const authErrorTests = require('./auth-error.test')
const documentTests = require('./document.test')
const libraryTests = require('./library.test')
const outboxTests = require('./outbox.test')
const publicationTests = require('./publication.test')
const readerTests = require('./reader.test')
const noteTests = require('./note.test')

const app = require('../../server').app

require('dotenv').config()

const allTests = async () => {
  if (process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }
  await activityTests(app)
  await authErrorTests(app)
  await documentTests(app)
  await libraryTests(app)
  await outboxTests(app)
  await publicationTests(app)
  await readerTests(app)
  await noteTests(app)

  if (process.env.POSTGRE_INSTANCE) {
    await app.knex.raw('DROP SCHEMA public CASCADE')
    await app.knex.raw('CREATE SCHEMA public')
    await app.terminate()
  }
}

allTests()
