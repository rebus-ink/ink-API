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

  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path
  let publicationUrl
  let activityUrl

  await tap.test('Create Publication', async () => {
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

    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
    activityUrl = res.get('Location')
  })

  await tap.test('Get Publicaiton', async () => {
    const activityObject = await getActivityFromUrl(app, activityUrl, token)
    publicationUrl = activityObject.object.id

    const res = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body['@context'], 'object')
    await tap.ok(Array.isArray(body['@context']))
    await tap.ok(Array.isArray(body.attachment))
    await tap.ok(Array.isArray(body.orderedItems))
    // check the order of items
    await tap.equal(body.attachment[0].name, 'Chapter 2')
    await tap.equal(body.attachment[2].name, 'Not a Chapter')
    await tap.equal(body.orderedItems[0].name, 'Chapter 1')
    await tap.notOk(body.orderedItems[2])
  })

  await tap.test('Get Publication that does not exist', async () => {
    const res = await request(app)
      .get(urlparse(publicationUrl).path + 'abc')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  await app.terminate()
  await destroyDB(app)
}

test()
