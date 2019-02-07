const activityTests = require('./Activity.test')
const documentTests = require('./Document.test')
const publicationTests = require('./Publication.test')
const readerTests = require('./Reader.test')
const noteTests = require('./Note.test')
const tagTests = require('./Tag.test')

const app = require('../../server').app

require('dotenv').config()

const allTests = async () => {
  if (process.env.POSTGRE_INSTANCE) {
    await app.initialize(true)
    await app.knex.migrate.rollback()
  }
  await activityTests(app)
  await documentTests(app)
  await publicationTests(app)
  await readerTests(app)
  await noteTests(app)
  await tagTests(app)

  if (process.env.POSTGRE_INSTANCE) {
    await app.knex.migrate.rollback()
    await app.terminate()
  }
}

allTests()
