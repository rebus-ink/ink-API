const request = require('supertest')
const app = require('../../../server').app

const createPublication = async (token, readerUrl, number = 1) => {
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
              type: 'Publication',
              name: 'Publication A',
              attributedTo: [
                {
                  type: 'Person',
                  name: 'Sample Author'
                }
              ],
              totalItems: 3,
              attachment: [
                {
                  type: 'Document',
                  name: 'Chapter 2',
                  position: 1
                },
                {
                  type: 'Document',
                  name: 'Chapter 1',
                  position: 0
                },
                {
                  type: 'Document',
                  name: 'Chapter 1',
                  position: 2
                },
                {
                  type: 'Document',
                  name: 'Chapter 1',
                  position: 3
                },
                {
                  type: 'Document',
                  name: 'Chapter 1',
                  position: 4
                },
                {
                  type: 'Document',
                  name: 'Chapter 1',
                  position: 5
                },
                {
                  type: 'Document',
                  name: 'Chapter 1',
                  position: 6
                },
                {
                  type: 'Document',
                  name: 'Chapter 1',
                  position: 7
                },
                {
                  type: 'Document',
                  name: 'Chapter 1',
                  position: 8
                },
                {
                  type: 'Document',
                  name: 'Chapter 1',
                  position: 9
                },
                {
                  type: 'Document',
                  name: 'Chapter 1',
                  position: 10
                },
                {
                  type: 'Document',
                  name: 'Not a Chapter'
                }
              ]
            }
          })
        )
    )
  }

  await Promise.all(promises)
}

module.exports = createPublication
