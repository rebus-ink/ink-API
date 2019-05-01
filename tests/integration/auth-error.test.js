const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl
} = require('./utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  // user1
  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path

  // user2
  const token2 = getToken()

  // create publication and documents for user 1
  const resActivity = await request(app)
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
          type: 'Publication',
          name: 'Publication A',
          description: 'description of publication A',
          author: [
            { type: 'Person', name: 'Sample Author' },
            { type: 'Organization', name: 'Org inc.' }
          ],
          editor: ['Sample editor'],
          inLanguage: ['English'],
          keywords: ['key', 'words'],
          json: {
            property1: 'value1'
          },
          readingOrder: [
            {
              '@context': 'https://www.w3.org/ns/activitystreams',
              type: 'Link',
              href: 'http://example.org/abc',
              hreflang: 'en',
              mediaType: 'text/html',
              name: 'An example link'
            },
            {
              '@context': 'https://www.w3.org/ns/activitystreams',
              type: 'Link',
              href: 'http://example.org/abc2',
              hreflang: 'en',
              mediaType: 'text/html',
              name: 'An example link2'
            }
          ],
          links: [
            {
              '@context': 'https://www.w3.org/ns/activitystreams',
              type: 'Link',
              href: 'http://example.org/abc3',
              hreflang: 'en',
              mediaType: 'text/html',
              name: 'An example link3'
            },
            {
              '@context': 'https://www.w3.org/ns/activitystreams',
              type: 'Link',
              href: 'http://example.org/abc4',
              hreflang: 'en',
              mediaType: 'text/html',
              name: 'An example link4'
            }
          ],
          resources: [
            {
              '@context': 'https://www.w3.org/ns/activitystreams',
              type: 'Link',
              href: 'http://example.org/abc5',
              hreflang: 'en',
              mediaType: 'text/html',
              name: 'An example link5'
            },
            {
              '@context': 'https://www.w3.org/ns/activitystreams',
              type: 'Link',
              href: 'http://example.org/abc6',
              hreflang: 'en',
              mediaType: 'text/html',
              name: 'An example link6'
            }
          ]
        }
      })
    )
  const activityUrl = resActivity.get('Location')
  const activityObject = await getActivityFromUrl(app, activityUrl, token)
  const publicationUrl = activityObject.object.id

  const resPublication = await request(app)
    .get(urlparse(publicationUrl).path)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  console.log('res Publication:   -------------')
  console.log(resPublication.body)

  // const documentUrl = resPublication.body.orderedItems[0].id
  // create Note for user 1

  const noteActivity = await request(app)
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
          type: 'Note',
          content: 'This is the content of note A.',
          'oa:hasSelector': {},
          context: publicationUrl,
          inReplyTo: documentUrl
        }
      })
    )

  // get the urls needed for the tests
  const noteActivityUrl = noteActivity.get('Location')

  const noteActivityObject = await getActivityFromUrl(
    app,
    noteActivityUrl,
    token
  )
  const noteUrl = noteActivityObject.object.id

  await tap.test('Try to get activity belonging to another user', async () => {
    const res = await request(app)
      .get(urlparse(activityUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })

  await tap.test(
    'Try to get publication belonging to another user',
    async () => {
      const res = await request(app)
        .get(urlparse(publicationUrl).path)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 403)
    }
  )

  await tap.test('Try to get document belonging to another user', async () => {
    const res = await request(app)
      .get(urlparse(documentUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })

  await tap.test('Try to get note belonging to another user', async () => {
    const res = await request(app)
      .get(urlparse(noteUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })

  await tap.test(
    'Try to get user object belonging to another user',
    async () => {
      const res = await request(app)
        .get(urlparse(userUrl).path)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 403)
    }
  )

  await tap.test('Try to get library belonging to another user', async () => {
    const res = await request(app)
      .get(`${urlparse(userUrl).path}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })

  await tap.test('Try to get outbox belonging to another user', async () => {
    const res = await request(app)
      .get(`${urlparse(userUrl).path}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })

  await tap.test(
    'Try to upload files to a folder belonging to another user',
    async () => {
      const res = await request(app)
        .post(`${urlparse(userUrl).path}/file-upload`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .attach('files', 'tests/test-files/test-file3.txt')
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
      await tap.equal(res.statusCode, 403)
    }
  )

  await tap.test('Requests without authentication', async () => {
    // outbox
    const res1 = await request(app)
      .get(`${urlparse(userUrl).path}/activity`)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res1.statusCode, 401)

    // user
    const res2 = await request(app)
      .get(urlparse(userUrl).path)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res2.statusCode, 401)

    const res3 = await request(app)
      .get('/whoami')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res3.statusCode, 401)

    // publication
    const res4 = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res4.statusCode, 401)

    // document
    const res5 = await request(app)
      .get(urlparse(documentUrl).path)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res5.statusCode, 401)

    // activity
    const res6 = await request(app)
      .get(urlparse(activityUrl).path)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res6.statusCode, 401)

    // file upload
    const res7 = await request(app)
      .post(`${urlparse(userUrl).path}/file-upload`)
      .set('Host', 'reader-api.test')
      .attach('files', 'tests/test-files/test-file3.txt')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res7.statusCode, 401)
  })

  await destroyDB(app)
  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
}

module.exports = test
