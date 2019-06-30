const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../integration/utils')
const app = require('../../server').app

const createPublication = require('./utils/createPublication')

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  await tap.test('Create 10 publications', async () => {
    const testName = 'create 10 publications'
    console.time(testName)
    await createPublication(token, readerUrl, 10)
    console.timeEnd(testName)
  })

  await tap.test('Create 100 publications', async () => {
    const testName = 'create 100 publications'
    console.time(testName)
    await createPublication(token, readerUrl, 100)
    console.timeEnd(testName)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
