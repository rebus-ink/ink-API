const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl
} = require('./utils')
const { urlToId } = require('../../routes/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path
  let stack

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
          author: ['John Smith'],
          editor: 'Jane Doe',
          description: 'this is a description!!',
          links: [{ property: 'value' }],
          readingOrder: [{ name: 'one' }, { name: 'two' }, { name: 'three' }],
          resources: [{ property: 'value' }],
          json: { property: 'value' }
        }
      })
    )

  const pubActivityUrl = resActivity.get('Location')
  const pubActivityObject = await getActivityFromUrl(app, pubActivityUrl, token)
  const publication = pubActivityObject.object

  await tap.test('Create Tag', async () => {
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
            type: 'reader:Stack',
            name: 'mystack'
          }
        })
      )
    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
    activityUrl = res.get('Location')
  })

  // await tap.test('Try to create a duplicate Tag', async () => {
  //   const res = await request(app)
  //     .post(`${userUrl}/activity`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type(
  //       'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  //     )
  //     .send(
  //       JSON.stringify({
  //         '@context': [
  //           'https://www.w3.org/ns/activitystreams',
  //           { reader: 'https://rebus.foundation/ns/reader' }
  //         ],
  //         type: 'Create',
  //         object: {
  //           type: 'reader:Stack',
  //           name: 'mystack'
  //         }
  //       })
  //     )
  //   await tap.equal(res.status, 400)
  //   await tap.ok(res.error.text.startsWith('duplicate error:'))
  // })

  await tap.test('Get tag when fetching library', async () => {
    const res = await request(app)
      .get(`${userUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(Array.isArray(body.tags))
    await tap.type(body.tags[0].name, 'string')
    stack = body.tags[0]
  })

  await tap.test('Assign publication to tag', async () => {
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
          type: 'Add',
          object: { id: stack.id, type: stack.type },
          target: { id: urlToId(publication.id) }
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
            type: 'Add',
            object: { id: 999, type: stack.type },
            target: { id: urlToId(publication.id) }
          })
        )
      await tap.equal(res.status, 404)
    }
  )

  await tap.test(
    'Try to assign publication to tag with invalid publication',
    async () => {
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
            type: 'Add',
            object: { id: stack.id, type: stack.type },
            target: { id: 'notanid' }
          })
        )
      await tap.equal(res.status, 404)
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
          type: 'Remove',
          object: stack,
          target: publication
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
            type: 'Remove',
            object: { id: 12345, type: stack.type },
            target: { id: publication.id }
          })
        )
      await tap.equal(res.status, 404)
    }
  )

  await tap.test(
    'Try to remove a tag from a publication with invalid publication',
    async () => {
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
            type: 'Remove',
            object: { id: stack.id, type: stack.type },
            target: { id: 'notanid' }
          })
        )
      await tap.equal(res.status, 404)
    }
  )

  // error disabled for now

  // await tap.test('Try to assign publication to tag twice', async () => {
  //   await request(app)
  //     .post(`${userUrl}/activity`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type(
  //       'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  //     )
  //     .send(
  //       JSON.stringify({
  //         '@context': [
  //           'https://www.w3.org/ns/activitystreams',
  //           { reader: 'https://rebus.foundation/ns/reader' }
  //         ],
  //         type: 'Add',
  //         object: stack,
  //         target: publication
  //       })
  //     )

  //   const res = await request(app)
  //     .post(`${userUrl}/activity`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type(
  //       'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  //     )
  //     .send(
  //       JSON.stringify({
  //         '@context': [
  //           'https://www.w3.org/ns/activitystreams',
  //           { reader: 'https://rebus.foundation/ns/reader' }
  //         ],
  //         type: 'Add',
  //         object: stack,
  //         target: publication
  //       })
  //     )
  //   await tap.equal(res.status, 400)

  //   // doesn't affect the publication
  //   const pubres = await request(app)
  //     .get(urlparse(publication.id).path)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type(
  //       'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  //     )

  //   await tap.equal(pubres.status, 200)
  //   const body = pubres.body
  //   await tap.ok(Array.isArray(body.tags))
  //   await tap.equal(body.tags.length, 1)
  //   await tap.equal(body.tags[0].type, 'reader:Stack')
  //   await tap.equal(body.tags[0].name, 'mystack')
  // })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
