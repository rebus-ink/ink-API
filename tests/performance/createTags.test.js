const tap = require('tap')
const { getToken } = require('../utils/utils')
const app = require('../../server').app

const createTags = require('./utils/createTags')
const createReader = require('./utils/createReader')

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerUrl = await createReader(token)

  await tap.test('Create 1 tag', async () => {
    const testName = 'create 1 tag'
    console.time(testName)
    await createTags(token, readerUrl, 1)
    console.timeEnd(testName)
  })

  await tap.test('Create 10 tags', async () => {
    const testName = 'create 10 tags'
    console.time(testName)
    await createTags(token, readerUrl, 10)
    console.timeEnd(testName)
  })
}

module.exports = test
