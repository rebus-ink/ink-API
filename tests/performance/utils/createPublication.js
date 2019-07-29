const axios = require('axios')

const createPublication = async (token, readerUrl, number = 1) => {
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
        },
        config
      )
    )
  }

  await Promise.all(promises)
}

module.exports = createPublication
