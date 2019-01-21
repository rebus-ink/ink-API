const activityTests = require('./Activity.test')
const documentTests = require('./Document.test')
const publicationTests = require('./Publication.test')
const readerTests = require('./Reader.test')
const noteTests = require('./Note.test')

const app = require('../../server').app

require('dotenv').config()

const allTests = async () => {
  if (process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }
  await activityTests(app)
  await documentTests(app)
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
