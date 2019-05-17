const request = require('supertest')
const app = require('../../../server').app
const crypto = require('crypto')

const createTags = async (token, readerUrl, number = 1) => {
  let promises = []

  for (let i = 0; i < number; i++) {
    promises.push(
      request(app)
        .post(`${readerUrl}/activity`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
        .send(
          JSON.stringify({
            '@context': [
              'https://www.w3.org/ns/activitystreams',
              { reader: 'https://rebus.foundation/ns/reader' }
            ],
            type: 'Create',
            object: {
              type: 'reader:Stack',
              name: crypto.randomBytes(8).toString('hex')
            }
          })
        )
    )
  }

  await Promise.all(promises)
}

module.exports = createTags
