const request = require('supertest')
const app = require('../../../server').app

const createDocument = async (token, userUrl, publicationUrl, number = 1) => {
  let promises = []

  for (let i = 0; i < number; i++) {
    promises.push(
      request(app)
        .post(`${userUrl}/activity`)
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
              type: 'Document',
              context: publicationUrl,
              name: 'Document A',
              content: 'This is the content of document A.'
            }
          })
        )
    )
  }

  await Promise.all(promises)
}

module.exports = createDocument
