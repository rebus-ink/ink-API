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
  const userUrl = await createReader(token)

  let config = {
    headers: {
      Host: process.env.DOMAIN,
      Authorization: `Bearer ${token}`,
      'Content-type':
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    }
  }

  await createPublication(token, userUrl, 10)

  const reslib = await axios.get(`${userUrl}/library`, config)

  const publicationUrl = reslib.data.items[0].id

  await tap.test('Get notes for reader with 10 notes', async () => {
    const testName = 'get notes for reader with 10 notes'
    await createNotes(token, userUrl, publicationUrl, 10)

    console.time(testName)
    const res = await axios.get(`${userUrl}/notes`, config)
    console.timeEnd(testName)

    await tap.equal(res.status, 200)

    const body = res.data
    await tap.type(body, 'object')
    await tap.equal(body.items.length, 10)
  })

  await tap.test('Get notes for user with 100 notes', async () => {
    const testName = 'get notes for user with 100 notes'
    await createNotes(token, userUrl, publicationUrl, 90)

    console.time(testName)
    const res = await axios.get(`${userUrl}/notes?limit=100`, config)
    console.timeEnd(testName)

    await tap.equal(res.status, 200)

    const body = res.data
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 100)
  })

  // TODO: figure out why the pagination is not working

  // await tap.test('Get notes for reader with 500 notes', async () => {
  //   const testName = 'get 100 notes from reader with 500 notes'
  //   await createNotes(token, userUrl, publicationUrl, 400)

  //   console.time(testName)
  //   const res = await axios.get(`${userUrl}/notes?limit=100`, config)
  //   console.timeEnd(testName)

  //   await tap.equal(res.status, 200)

  //   const body = res.data
  //   await tap.type(body, 'object')
  //   await tap.type(body.totalItems, 'number')
  //   await tap.equal(body.totalItems, 100)
  // })

  // await tap.test('Get notes for reader with 1000 notes', async () => {
  //   const testName =
  //     'get 100 notes from last page of notes collection with 1000 notes'
  //   await createNotes(token, userUrl, publicationUrl, 500)

  //   console.time(testName)
  //   const res = await axios.get(`${userUrl}/notes?limit=100&page=10`, config)
  //   console.timeEnd(testName)

  //   await tap.equal(res.status, 200)

  //   const body = res.data
  //   await tap.type(body, 'object')
  //   await tap.type(body.totalItems, 'number')
  //   await tap.equal(body.totalItems, 100)
  // })
}

module.exports = test
