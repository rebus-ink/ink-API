const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl,
  createPublication
} = require('../utils/utils')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  const resActivity = await createPublication(app, token, readerUrl)

  const pubActivityUrl = resActivity.get('Location')
  const pubActivityObject = await getActivityFromUrl(app, pubActivityUrl, token)
  const publication = pubActivityObject.object

  // create Tag
  await request(app)
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
          name: 'mystack',
          json: { property: 'value' }
        }
      })
    )

  // get tag object by fetching the library
  const libraryRes = await request(app)
    .get(`${readerUrl}/library`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  const stack = libraryRes.body.tags[0]

  await tap.test('Assign publication to tag', async () => {
    const res = await request(app)
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
          type: 'Add',
          object: { id: stack.id, type: stack.type },
          target: { id: urlToId(publication.id), type: 'Publication' }
        })
      )

    await tap.equal(res.status, 201)

    const pubres = await request(app)
      .get(urlparse(publication.id).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(pubres.status, 200)
    const body = pubres.body
    await tap.ok(Array.isArray(body.tags))
    await tap.equal(body.tags.length, 1)
    await tap.equal(body.tags[0].type, 'reader:Stack')
    await tap.equal(body.tags[0].name, 'mystack')
  })

  await tap.test(
    'Try to assign publication to tag with invalid tag',
    async () => {
      const res = await request(app)
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
            type: 'Add',
            object: { id: '999', type: stack.type },
            target: { id: urlToId(publication.id), type: 'Publication' }
          })
        )
      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.details.type, 'Tag')
      await tap.equal(error.details.activity, 'Add Tag to Publication')
    }
  )

  await tap.test(
    'Try to assign publication to tag with invalid publication',
    async () => {
      const res = await request(app)
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
            type: 'Add',
            object: { id: stack.id, type: stack.type },
            target: { id: 'notanid', type: 'Publication' }
          })
        )
      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.details.type, 'Publication')
      await tap.equal(error.details.activity, 'Add Tag to Publication')
    }
  )

  await tap.test('remove tag from publication', async () => {
    const pubresbefore = await request(app)
      .get(urlparse(publication.id).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(pubresbefore.status, 200)
    const bodybefore = pubresbefore.body
    await tap.ok(Array.isArray(bodybefore.tags))
    await tap.equal(bodybefore.tags.length, 1)

    const res = await request(app)
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
          type: 'Remove',
          object: stack,
          target: { id: publication.id, type: 'Publication' }
        })
      )

    await tap.equal(res.status, 201)

    const pubres = await request(app)
      .get(urlparse(publication.id).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(pubres.status, 200)
    const body = pubres.body
    await tap.ok(Array.isArray(body.tags))
    await tap.equal(body.tags.length, 0)
  })

  await tap.test(
    'Try to remove a tag from a publication with invalid tag',
    async () => {
      const res = await request(app)
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
            type: 'Remove',
            object: { id: 12345, type: stack.type },
            target: { id: publication.id, type: 'Publication' }
          })
        )
      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.details.type, 'Publication_Tag')
      await tap.equal(error.details.activity, 'Remove Tag from Publication')
    }
  )

  await tap.test(
    'Try to remove a tag from a publication with invalid publication',
    async () => {
      const res = await request(app)
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
            type: 'Remove',
            object: { id: stack.id, type: stack.type },
            target: { id: 'notanid', type: 'Publication' }
          })
        )
      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.details.type, 'Publication_Tag')
      await tap.equal(error.details.activity, 'Remove Tag from Publication')
    }
  )

  await tap.test(
    'Try to remove a tag from a publication with undefined tag',
    async () => {
      const res = await request(app)
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
            type: 'Remove',
            object: { id: undefined, type: stack.type },
            target: { id: publication.id, type: 'Publication' }
          })
        )
      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.details.type, 'Tag')
      await tap.equal(error.details.activity, 'Remove Tag from Publication')
    }
  )

  await tap.test(
    'Try to remove a tag from a publication with undefined publication',
    async () => {
      const res = await request(app)
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
            type: 'Remove',
            object: { id: stack.id, type: stack.type },
            target: { id: undefined, type: 'Publication' }
          })
        )
      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.details.type, 'Publication')
      await tap.equal(error.details.activity, 'Remove Tag from Publication')
    }
  )

  await tap.test('Try to assign publication to tag twice', async () => {
    await request(app)
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
          type: 'Add',
          object: stack,
          target: { id: publication.id, type: 'Publication' }
        })
      )

    const res = await request(app)
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
          type: 'Add',
          object: stack,
          target: { id: publication.id, type: 'Publication' }
        })
      )
    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.details.type, 'Publication_Tag')
    await tap.equal(error.details.activity, 'Add Tag to Publication')
    await tap.type(error.details.target, 'string')
    await tap.type(error.details.object, 'string')
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
