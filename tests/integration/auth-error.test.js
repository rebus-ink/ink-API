const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl
} = require('./utils')
const app = require('../../server').app

const test = async () => {
  await app.initialize()

  // user1
  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path

  // user2
  const token2 = getToken()

  // create publication and documents for user 1
  const res = await request(app)
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
          type: 'reader:Publication',
          name: 'Publication A',
          attributedTo: [
            {
              type: 'Person',
              name: 'Sample Author'
            }
          ],
          totalItems: 2,
          attachment: [
            {
              type: 'Document',
              name: 'Chapter 2',
              content: 'Sample document content 2',
              position: 1
            },
            {
              type: 'Document',
              name: 'Chapter 1',
              content: 'Sample document content 1',
              position: 0
            },
            {
              type: 'Document',
              name: 'Not a Chapter',
              content: 'not a chapter: does not have a position!'
            }
          ]
        }
      })
    )

  const activityUrl = res.get('Location')

  const activityObject = await getActivityFromUrl(app, activityUrl, token)
  const publicationUrl = activityObject.object.id

  const resPublication = await request(app)
    .get(urlparse(publicationUrl).path)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )
  const documentUrl = resPublication.body.orderedItems[0].id

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

  await app.terminate()
  await destroyDB()
}

test()
