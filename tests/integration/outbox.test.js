const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('./utils')
const app = require('../../server').app

const test = async () => {
  await app.initialize()

  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path

  await tap.test('Create Activity', async () => {
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
            totalItems: 0,
            orderedItems: []
          }
        })
      )

    await tap.equal(res.status, 201)
  })

  await tap.test('Get Outbox', async () => {
    const res = await request(app)
      .get(`${userUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body['@context'], 'string')
    await tap.equal(body.type, 'OrderedCollection')
    await tap.type(body.summaryMap, 'object')
    await tap.ok(Array.isArray(body.orderedItems))
    await tap.type(body.orderedItems[0], 'object')
    await tap.type(body.orderedItems[0].type, 'string')
    await tap.equal(body.orderedItems[0].object.type, 'reader:Publication')
    await tap.equal(body.orderedItems[0].type, 'Create')
    await tap.type(body.orderedItems[0].actor, 'object')
    await tap.equal(body.orderedItems[0].actor.type, 'Person')
    await tap.type(body.orderedItems[0].summaryMap, 'object')
    await tap.type(body.orderedItems[0].id, 'string')
  })

  await app.terminate()
  await destroyDB()
}

test()
