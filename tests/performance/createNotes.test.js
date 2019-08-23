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
  const readerUrl = await createReader(token)
  let config = {
    auth: {
      bearer: token
    }
  }

  await createPublication(token, readerUrl, 10)

  const res = await requestGet(`${readerUrl}/library`, config)
  const publicationUrl = JSON.parse(res.body).items[0].id

  await tap.test('Create 1 note', async () => {
    const testName = 'create 1 note'
    console.time(testName)
    await createNotes(token, readerUrl, publicationUrl, 1)
    console.timeEnd(testName)
  })

  await tap.test('Create 10 notes', async () => {
    const testName = 'create 10 notes'
    console.time(testName)
    await createNotes(token, readerUrl, publicationUrl, 10)
    console.timeEnd(testName)
  })

  // await tap.test('Create 100 notes', async () => {
  //   const testName = 'create 100 notes'
  //   console.time(testName)
  //   await createNotes(token, readerUrl, publicationUrl, 100)
  //   console.timeEnd(testName)
  // })
}

module.exports = test
