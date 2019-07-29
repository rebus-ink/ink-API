const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../utils/utils')
const app = require('../../server').app
const axios = require('axios')

const createPublication = require('./utils/createPublication')
const createReader = require('./utils/createReader')

const test = async () => {
  const token = getToken()
  const readerUrl = await createReader(token)
  let config = {
    headers: {
      Host: process.env.DOMAIN,
      Authorization: `Bearer ${token}`,
      'Content-type':
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    }
  }

  await tap.test('whoami route', async () => {
    const testName = 'whoami route'
    await createPublication(token, readerUrl, 100)

    console.time(testName)
    const res = await axios.get(`${process.env.DOMAIN}/whoami`, config)
    console.timeEnd(testName)

    await tap.equal(res.status, 200)
  })
}

module.exports = test
