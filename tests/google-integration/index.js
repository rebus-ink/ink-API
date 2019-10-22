const fileUploadTests = require('./file-upload.test')
const searchTests = require('./search.test')
const fileUploadPubTests = require('./file-upload-pub.test')

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

  //  await searchTests(app)
  await fileUploadPubTests(app)
  // await fileUploadTests(app)

  if (process.env.POSTGRE_INSTANCE) {
    await app.knex.migrate.rollback()
    await app.terminate()
  }
}

allTests()
