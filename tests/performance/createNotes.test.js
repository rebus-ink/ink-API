const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../utils/utils')
const app = require('../../server').app
const { urlToId } = require('../../utils/utils')
const axios = require('axios')

const createPublication = require('./utils/createPublication')
const createNotes = require('./utils/createNotes')
const createReader = require('./utils/createReader')

const test = async () => {
  const token = getToken()
  const readerUrl = await createReader(token)
  let config = {
    headers: {
      Host: process.env.DOMAIN,
      Authorization: `Bearer ${token}`
    }
  }

  await createPublication(token, readerUrl, 10)

  const res = await axios.get(`${readerUrl}/library`, config)

  const publicationUrl = res.data.items[0].id

  await tap.test('Create 10 notes', async () => {
    const testName = 'create 10 notes'
    console.time(testName)
    await createNotes(token, readerUrl, publicationUrl, 10)
    console.timeEnd(testName)
  })

  await tap.test('Create 100 notes', async () => {
    const testName = 'create 100 notes'
    console.time(testName)
    await createNotes(token, readerUrl, publicationUrl, 100)
    console.timeEnd(testName)
  })

  // await destroyDB(app)
}

module.exports = test
