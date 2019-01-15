const activityTests = require('./activity.test')
const authErrorTests = require('./auth-error.test')
const documentTests = require('./document.test')
const libraryTests = require('./library.test')
const outboxTests = require('./outbox.test')
const publicationTests = require('./publication.test')
const readerTests = require('./reader.test')

const app = require('../../server').app

if (process.env.POSTGRE_INSTANCE) {
  app.initialize()
}

activityTests()
authErrorTests()
documentTests()
libraryTests()
outboxTests()
publicationTests()
readerTests()

if (process.env.POSTGRE_INSTANCE) {
  app.terminate()
}
