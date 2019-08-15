const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../utils/utils')
const app = require('../../server').app
const axios = require('axios')
const querystring = require('querystring')
const createPublication = require('./utils/createPublication')
const createReader = require('./utils/createReader')

const test = async () => {
  // const token = getToken()
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJFNTU2Q0JCOS0zRTAwLTQ4NDctQjAxQy00MTVBODFDRTNBQzEiLCJpYXQiOjE1NjU4NzY3NTQsImV4cCI6MTU2NjQ4MTU1NCwiYXVkIjoiUkVCVVNfQVBJIiwiaXNzIjoiUkVCVVNfUkVBREVSIn0.lj5JNWZjlY0WXqSD-ljMR7QCsBW3f_R0fextkbhZZf8'
  // const readerUrl = await createReader(token)
  const readerUrl =
    'https://rr-dev.rebus.works/reader-9afdf8ec99ff1fce7d38e0df08726c9e'
  let config = {
    headers: {
      Host: process.env.DOMAIN,
      Authorization: `Bearer ${token}`,
      'Content-type':
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    }
  }

  await tap.test('Get library with 10 publications', async () => {
    const testName = 'get library with 10 publications'
    await createPublication(token, readerUrl, 10)

    console.time(testName)
    const res = await axios.get(`${readerUrl}/library`, config)
    console.timeEnd(testName)

    await tap.equal(res.status, 200)

    const body = res.data
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 10)
  })

  await tap.test('Get library with 10 publications again', async () => {
    const testName = 'get library with 10 publications again'
    await createPublication(token, readerUrl, 10)

    console.time(testName)
    const res = await axios.get(`${readerUrl}/library`, config)
    console.timeEnd(testName)

    await tap.equal(res.status, 200)

    const body = res.data
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    // await tap.equal(body.totalItems, 10)
  })

  await tap.test('Get library with 100 publications', async () => {
    const testName = 'get library with 100 publications'
    await createPublication(token, readerUrl, 80) // adding to the 20 already there

    console.time(testName)
    const res = await axios.get(`${readerUrl}/library`, config)
    console.timeEnd(testName)

    await tap.equal(res.status, 200)

    const body = res.data
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 100)
  })

  // TODO: figure out why pagination is not working.

  // await tap.test('Get library with 500 publications', async () => {
  //   const testName = 'get 100 pubs from library with 500 publications'
  //   await createPublication(token, readerUrl, 400) // adding to the 100 already there

  //   config.params = { limit: 100 }

  //   console.time(testName)
  //   const res = await axios.get(`${readerUrl}/library`, config)
  //   console.timeEnd(testName)

  //   await tap.equal(res.status, 200)

  //   const body = res.data
  //   await tap.type(body, 'object')
  //   await tap.type(body.totalItems, 'number')
  //   await tap.equal(body.totalItems, 100)
  // })

  // await tap.test('Get library with 500 publications', async () => {
  //   const testName =
  //     'get 100 pubs from last page of library with 600 publications'
  //   await createPublication(token, readerUrl, 500) // adding to the 100 already there
  //   config.params = { limit: 100, page: 6 }

  //   console.time(testName)
  //   const res = await axios.get(`${readerUrl}/library`, config)
  //   console.timeEnd(testName)

  //   await tap.equal(res.status, 200)

  //   const body = res.data
  //   await tap.type(body, 'object')
  //   await tap.type(body.totalItems, 'number')
  //   await tap.equal(body.totalItems, 100)
  // })
}

module.exports = test
