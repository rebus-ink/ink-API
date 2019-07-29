const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../utils/utils')
const app = require('../../server').app
const axios = require('axios')

const createPublication = require('./utils/createPublication')
const createTags = require('./utils/createTags')
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

  await createPublication(token, readerUrl, 100)

  await createTags(token, readerUrl, 100)

  const res = await axios.get(`${readerUrl}/library`, config)

  const publicationUrl = res.data.items[0].id
  const tagId = res.data.tags[0].id

  await tap.test('Assign a tag to a publication', async () => {
    const testName = 'assign tag to publication'
    console.time(testName)
    const res1 = await axios.post(
      `${readerUrl}/activity`,
      {
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          { reader: 'https://rebus.foundation/ns/reader' }
        ],
        type: 'Add',
        object: { id: tagId, type: 'reader:Tag', tagType: 'reader:Stack' },
        target: { id: publicationUrl, type: 'Publication' }
      },
      config
    )
    console.timeEnd(testName)

    await tap.equal(res1.status, 201)
  })

  await tap.test('Remove tag from a publication', async () => {
    const testName = 'remove tag from publication'
    console.time(testName)

    const res1 = await axios.post(
      `${readerUrl}/activity`,
      {
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          { reader: 'https://rebus.foundation/ns/reader' }
        ],
        type: 'Remove',
        object: { id: tagId, type: 'reader:Tag', tagType: 'reader:Stack' },
        target: { id: publicationUrl, type: 'Publication' }
      },
      config
    )

    console.timeEnd(testName)
    await tap.equal(res1.status, 201)
  })

  // if (!process.env.POSTGRE_INSTANCE) {
  //   await app.terminate()
  // }
  // await destroyDB(app)
}

module.exports = test
