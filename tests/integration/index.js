const activityTests = require('./activity.test')
const authErrorTests = require('./auth-error.test')
const documentTests = require('./document.test')
const libraryTests = require('./library.test')
const outboxTests = require('./outbox.test')
const publicationTests = require('./publication.test')
const readerTests = require('./reader.test')

const app = require('../../server').app

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

  if (process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
}

allTests()
