const searchTests = require('./search.test')

const app = require('../../server').app

require('dotenv').config()

const allTests = async () => {
  await app.initialize(true)
  await app.knex.migrate.rollback()
  if (process.env.POSTGRE_DB === 'ci_test') {
    await app.knex.migrate.latest()
  }

  await searchTests(app)

  await app.knex.migrate.rollback()
  await app.terminate()
}

allTests()
