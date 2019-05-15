const activityTests = require('./activity.test')
const authErrorTests = require('./auth-error.test')
const libraryTests = require('./library.test')
const outboxTests = require('./outbox.test')
const publicationTests = require('./publication.test')
const readerTests = require('./reader.test')
const noteTests = require('./note.test')
const tagTests = require('./tag.test')

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
  //  await activityTests(app)
  //  await authErrorTests(app)
  await libraryTests(app)
  //  await outboxTests(app)
  //  await publicationTests(app)
  //  await readerTests(app)
  //  await noteTests(app)
  //  await tagTests(app)

  if (process.env.POSTGRE_INSTANCE) {
    await app.knex.migrate.rollback()
    await app.terminate()
  }
}

allTests()
