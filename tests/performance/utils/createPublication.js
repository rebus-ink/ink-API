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
              name: 'Publication ' + i,
              author: ['John Smith'],
              editor: 'Jané S. Doe',
              description: 'this is a description!!',
              inLanguage: 'English',
              links: [
                {
                  '@context': 'https://www.w3.org/ns/activitystreams',
                  href: 'http://example.org/abc',
                  hreflang: 'en',
                  mediaType: 'text/html',
                  name: 'An example link'
                }
              ],
              readingOrder: [
                {
                  '@context': 'https://www.w3.org/ns/activitystreams',
                  href: 'http://example.org/abc',
                  hreflang: 'en',
                  mediaType: 'text/html',
                  name: 'An example reading order object1'
                },
                {
                  '@context': 'https://www.w3.org/ns/activitystreams',
                  href: 'http://example.org/abc',
                  hreflang: 'en',
                  mediaType: 'text/html',
                  name: 'An example reading order object2'
                },
                {
                  '@context': 'https://www.w3.org/ns/activitystreams',
                  href: 'http://example.org/abc',
                  hreflang: 'en',
                  mediaType: 'text/html',
                  name: 'An example reading order object3'
                }
              ],
              resources: [
                {
                  '@context': 'https://www.w3.org/ns/activitystreams',
                  href: 'http://example.org/abc',
                  hreflang: 'en',
                  mediaType: 'text/html',
                  name: 'An example resource'
                }
              ],
              json: { property: 'value' }
            }
          })
        )
    )
  }

  await Promise.all(promises)
}

module.exports = createPublication
