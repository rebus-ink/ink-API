const tap = require('tap')
const { getToken } = require('../utils/utils')
const request = require('request')
const util = require('util')

const requestGet = util.promisify(request.get)
const requestPost = util.promisify(request.post)

const createPublication = require('./utils/createPublication')
const createTags = require('./utils/createTags')
const createReader = require('./utils/createReader')

const test = async () => {
  const token = getToken()
  const readerUrl = await createReader(token)
  let config = {
    headers: {
      'Content-type':
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    },
    auth: {
      bearer: token
    }
  }

  await createPublication(token, readerUrl, 100)

  await createTags(token, readerUrl, 100)

  const res = await requestGet(`${readerUrl}/library`, config)

  const publicationUrl = JSON.parse(res.body).items[0].id
  const tagId = JSON.parse(res.body).tags[0].id

  await tap.test('Assign a tag to a publication', async () => {
    const testName = 'assign tag to publication'
    console.time(testName)
    const res1 = await requestPost(`${readerUrl}/activity`, {
      body: JSON.stringify({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          { reader: 'https://rebus.foundation/ns/reader' }
        ],
        type: 'Add',
        object: { id: tagId, type: 'reader:Tag', tagType: 'reader:Stack' },
        target: { id: publicationUrl, type: 'Publication' }
      }),
      headers: {
        'Content-type':
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      },
      auth: {
        bearer: token
      }
    })
    console.timeEnd(testName)

    await tap.equal(res1.statusCode, 201)
  })

  await tap.test('Remove tag from a publication', async () => {
    const testName = 'remove tag from publication'
    console.time(testName)

    const res1 = await requestPost(`${readerUrl}/activity`, {
      body: JSON.stringify({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          { reader: 'https://rebus.foundation/ns/reader' }
        ],
        type: 'Remove',
        object: { id: tagId, type: 'reader:Tag', tagType: 'reader:Stack' },
        target: { id: publicationUrl, type: 'Publication' }
      }),
      headers: {
        'Content-type':
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      },
      auth: {
        bearer: token
      }
    })

    console.timeEnd(testName)
    await tap.equal(res1.statusCode, 201)
  })
}

module.exports = test
