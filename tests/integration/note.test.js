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

  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path
  let noteUrl
  let activityUrl

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
              name: 'Chapter 1',
              content: 'Sample document content 1',
              position: 0
            }
          ]
        }
      })
    )

  const pubActivityUrl = resActivity.get('Location')
  const pubActivityObject = await getActivityFromUrl(app, pubActivityUrl, token)
  const publicationUrl = pubActivityObject.object.id
  const resPublication = await request(app)
    .get(urlparse(publicationUrl).path)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )
  const documentUrl = resPublication.body.orderedItems[0].id

  await tap.test('Create Note', async () => {
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
            type: 'Note',
            content: 'This is the content of note A.',
            'oa:hasSelector': {},
            context: publicationUrl,
            inReplyTo: documentUrl
          }
        })
      )

    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
    activityUrl = res.get('Location')
  })

  await tap.test('Get note', async () => {
    const activityObject = await getActivityFromUrl(app, activityUrl, token)
    noteUrl = activityObject.object.id

    const res = await request(app)
      .get(urlparse(noteUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.type, 'Note')
    await tap.type(body.id, 'string')
    await tap.type(body.inReplyTo, 'string')
    await tap.type(body.context, 'string')
    await tap.type(body['oa:hasSelector'], 'object')
    await tap.type(body['@context'], 'object')
    await tap.ok(Array.isArray(body['@context']))
  })

  await tap.test('Get Note that does not exist', async () => {
    const res = await request(app)
      .get(urlparse(noteUrl).path + 'abc')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
