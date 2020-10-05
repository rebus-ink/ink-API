const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createTag
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  await tap.test('Get Tags for a reader with no tags', async () => {
    const res = await request(app)
      .get('/tags')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.length, 13) // 9 flags + 4 colours
  })

  await createTag(app, token, { name: 'tag1' })
  await createTag(app, token, { name: 'tag2' })

  await tap.test('Get Tags', async () => {
    const res = await request(app)
      .get('/tags')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.length, 15) // 9 flags + 4 colours + 2 created tags

    const body = res.body[0]
    await tap.ok(body.id)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.ok(body.name)
    await tap.ok(body.published)
    await tap.ok(body.updated)
    await tap.ok(body.type)
  })

  if (process.env.REDIS_PASSWORD) {
    await tap.test(
      'Get Tags with if-modified-since header - not modified',
      async () => {
        time = new Date().getTime()
        // with time at beginning - so it will be modified
        const res = await request(app)
          .get('/tags')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')

        await tap.equal(res.statusCode, 304)
        await tap.ok(_.isEmpty(res.body))
      }
    )

    let tag = await createTag(app, token, { type: 'test', name: 'test123' })

    await tap.test(
      'Get Tags with if-modified-since header - after tag created',
      async () => {
        const res = await request(app)
          .get('/tags')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Tags with if-modified-since header - after tag updated',
      async () => {
        const resUpdate = await request(app)
          .put(`/tags/${tag.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              id: tag.id,
              readerId: tag.readerId,
              type: 'test',
              name: 'new name'
            })
          )

        await tap.equal(resUpdate.statusCode, 200)

        const res = await request(app)
          .get('/tags')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Tags with if-modified-since header - after tag deleted',
      async () => {
        const resUpdate = await request(app)
          .delete(`/tags/${tag.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resUpdate.statusCode, 204)

        const res = await request(app)
          .get('/tags')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Tags with if-modified-since header - after source created with a new tag',
      async () => {
        const resUpdate = await request(app)
          .post('/sources')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              name: 'title1',
              type: 'Book',
              tags: [{ name: 'tag3434', type: 'test' }]
            })
          )

        await tap.equal(resUpdate.statusCode, 201)

        const res = await request(app)
          .get('/tags')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Tags with if-modified-since header - after note created with a new tag',
      async () => {
        const resUpdate = await request(app)
          .post('/notes')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              body: { motivation: 'highlighting' },
              tags: [{ name: 'tag999', type: 'test' }]
            })
          )

        await tap.equal(resUpdate.statusCode, 201)

        const res = await request(app)
          .get('/tags')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        time = new Date().getTime()
      }
    )
  }

  await destroyDB(app)
}

module.exports = test
