const tap = require('tap')
const { getToken } = require('../utils/utils')
const request = require('request')
const util = require('util')

const requestGet = util.promisify(request.get)

const createPublication = require('./utils/createPublication')
const createReader = require('./utils/createReader')

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

  await tap.test('whoami route', async () => {
    const testName = 'whoami route'
    await createPublication(token, readerUrl, 100)

    console.time(testName)
    const res = await requestGet(`${process.env.DOMAIN}/whoami`, config)
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)
  })
}

module.exports = test
