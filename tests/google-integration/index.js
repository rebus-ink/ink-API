const searchTests = require('./search.test')

const app = require('../../server').app

require('dotenv').config()

const allTests = async () => {
  await app.initialize(true)
  await app.knex.migrate.rollback()
  if (process.env.DATABASE_URL === 'postgres://ink:ink@127.0.0.1:5432/ci_test') {
    await app.knex.migrate.latest()
  }

  await searchTests(app)

  await app.knex.migrate.rollback()
  await app.terminate()
}

allTests()
