const tap = require('tap')
const { getToken } = require('../utils/utils')
const request = require('request')
const util = require('util')

const requestGet = util.promisify(request.get)

const createPublication = require('./utils/createPublication')
const createNotes = require('./utils/createNotes')
const createReader = require('./utils/createReader')

const test = async () => {
  const token = getToken()
  const userUrl = await createReader(token)

  let config = {
    auth: {
      bearer: token
    },
    headers: {
      'Content-type':
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    }
  }

  await createPublication(token, userUrl, 10)

  const reslib = await requestGet(`${userUrl}/library`, config)

  const publicationUrl = JSON.parse(reslib.body).items[0].id

  await tap.test('Get notes for reader with 10 notes', async () => {
    const testName = 'get notes for reader with 10 notes'
    await createNotes(token, userUrl, publicationUrl, 10)

    console.time(testName)
    const res = await requestGet(`${userUrl}/notes`, config)
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)

    const body = JSON.parse(res.body)
    await tap.type(body, 'object')
    await tap.equal(body.items.length, 10)
  })

  await tap.test('Get notes for user with 100 notes', async () => {
    const testName = 'get notes for user with 100 notes'
    await createNotes(token, userUrl, publicationUrl, 90)

    console.time(testName)
    const res = await requestGet(`${userUrl}/notes?limit=100`, config)
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)

    const body = JSON.parse(res.body)
    await tap.type(body, 'object')
    await tap.equal(body.items.length, 100)
  })

  await tap.test('Get notes for reader with 500 notes', async () => {
    const testName = 'get 100 notes from reader with 500 notes'
    await createNotes(token, userUrl, publicationUrl, 400)

    console.time(testName)
    const res = await requestGet(`${userUrl}/notes?limit=100`, config)
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)

    const body = JSON.parse(res.body)
    await tap.equal(body.items.length, 100)
  })
}

module.exports = test
