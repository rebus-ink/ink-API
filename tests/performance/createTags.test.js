const tap = require('tap')
const urlparse = require('url').parse
const { getToken, destroyDB } = require('../utils/utils')
const app = require('../../server').app

const createTags = require('./utils/createTags')
const createReader = require('./utils/createReader')

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerUrl = await createReader(token)

  await tap.test('Create 10 tags', async () => {
    const testName = 'create 10 tags'
    console.time(testName)
    await createTags(token, readerUrl, 10)
    console.timeEnd(testName)
  })

  // if (!process.env.POSTGRE_INSTANCE) {
  //   await app.terminate()
  // }
  // await destroyDB(app)
}

module.exports = test
