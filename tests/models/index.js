const activityTests = require('./Activity.test')
const documentTests = require('./Document.test')
const publicationTests = require('./Publication.test')
const readerTests = require('./Reader.test')

const app = require('../../server').app

const allTests = async () => {
  if (process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }
  await activityTests(app)
  await documentTests(app)
  await publicationTests(app)
  await readerTests(app)

  if (process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
}

allTests()
