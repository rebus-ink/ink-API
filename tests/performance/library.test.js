const tap = require('tap')
const { getToken } = require('../utils/utils')
const createPublication = require('./utils/createPublication')
const createReader = require('./utils/createReader')
const request = require('request')
const util = require('util')

const requestGet = util.promisify(request.get)

const test = async () => {
  const token = getToken()
  const readerUrl = await createReader(token)
  let config = {
    auth: {
      bearer: token
    },
    headers: {
      'Content-type':
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    }
  }

  await tap.test('Get library with 10 publications', async () => {
    const testName = 'get library with 10 publications'
    await createPublication(token, readerUrl, 10)

    console.time(testName)
    const res = await requestGet(`${readerUrl}/library`, config)
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)

    const body = JSON.parse(res.body)
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 10)
  })

  await tap.test('Get library with 10 publications again', async () => {
    const testName = 'get library with 10 publications again'

    console.time(testName)
    const res = await requestGet(`${readerUrl}/library`, config)
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)

    const body = JSON.parse(res.body)
    await tap.type(body, 'object')
    await tap.equal(body.items.length, 10)
  })

  await tap.test('Get library with 100 publications', async () => {
    const testName = 'get library with 100 publications'
    await createPublication(token, readerUrl, 90) // adding to the 10 already there

    console.time(testName)
    const res = await requestGet(`${readerUrl}/library`, config)
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)

    const body = JSON.parse(res.body)
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 100)
  })

  await tap.test('Get library with 500 publications', async () => {
    const testName = 'get 100 pubs from library with 500 publications'
    await createPublication(token, readerUrl, 400) // adding to the 100 already there

    config.qs = { limit: 100 }

    console.time(testName)
    const res = await requestGet(`${readerUrl}/library`, config)
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)

    const body = JSON.parse(res.body)
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.items.length, 100)
  })

  await tap.test('Get library with 500 publications', async () => {
    const testName =
      'get 100 pubs from last page of library with 500 publications'
    config.qs = { limit: 100, page: 3 }

    console.time(testName)
    const res = await requestGet(`${readerUrl}/library`, config)
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)

    const body = JSON.parse(res.body)
    await tap.type(body, 'object')
    await tap.equal(body.items.length, 100)
  })
}

module.exports = test
