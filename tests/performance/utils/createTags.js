const request = require('supertest')
const app = require('../../../server').app
const crypto = require('crypto')
const axios = require('axios')

const createTags = async (token, readerUrl, number = 1) => {
  let promises = []
  let config = {
    headers: {
      Host: process.env.DOMAIN,
      Authorization: `Bearer ${token}`,
      'Content-type':
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    }
  }

  for (let i = 0; i < number; i++) {
    promises.push(
      axios.post(
        `${readerUrl}/activity`,
        {
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            { reader: 'https://rebus.foundation/ns/reader' }
          ],
          type: 'Create',
          object: {
            type: 'reader:Tag',
            tagType: 'reader:Stack',
            name: crypto.randomBytes(8).toString('hex')
          }
        },
        config
      )
    )
  }

  await Promise.all(promises)
}

module.exports = createTags
