const tap = require('tap')
const { getToken } = require('../utils/utils')

const createPublication = require('./utils/createPublication')
const createReader = require('./utils/createReader')

const test = async () => {
  const token = getToken()
  const readerUrl = await createReader(token)

  await tap.test('Create 1 publication', async () => {
    const testName = 'create 1 publication'
    console.time(testName)
    await createPublication(token, readerUrl, 1)
    console.timeEnd(testName)
  })

  await tap.test('Create 10 publications', async () => {
    const testName = 'create 10 publications'
    console.time(testName)
    await createPublication(token, readerUrl, 10)
    console.timeEnd(testName)
  })

  // await tap.test('Create 100 publications', async () => {
  //   const testName = 'create 100 publications'
  //   console.time(testName)
  //   await createPublication(token, readerUrl, 100)
  //   console.timeEnd(testName)
  // })
}

module.exports = test
