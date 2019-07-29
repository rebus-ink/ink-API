const tap = require('tap')
const { getToken } = require('../utils/utils')
const app = require('../../server').app

const createPublication = require('./utils/createPublication')
const createReader = require('./utils/createReader')

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerUrl = await createReader(token)

  await tap.test('Create 10 publications', async () => {
    const testName = 'create 10 publications'
    console.time(testName)
    await createPublication(token, readerUrl, 1)
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
  // await destroyDB(app)
}

module.exports = test
