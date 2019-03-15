const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../integration/utils')
const app = require('../../server').app

const createTags = require('./utils/createTags')

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path

  await tap.test('Create 10 tags', async () => {
    const testName = 'create 10 tags'
    console.time(testName)
    await createTags(token, userUrl, 10)
    console.timeEnd(testName)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
