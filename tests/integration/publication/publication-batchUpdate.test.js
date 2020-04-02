const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerId = urlToId(readerCompleteUrl)

  const pub1 = await createPublication(app, token, {
    type: 'Book',
    name: 'Publication A',
    author: ['John Smith'],
    editor: 'Jané S. Doe',
    contributor: ['Sample Contributor'],
    bookFormat: 'EBook',
    keywords: ['one', 'two']
  })

  const pub2 = await createPublication(app, token, {
    type: 'Book',
    name: 'Publication B',
    author: ['John Smith'],
    contributor: ['Contributor1', 'Contributor2'],
    bookFormat: 'EBook',
    keywords: ['one']
  })

  const pub3 = await createPublication(app, token, {
    type: 'Book',
    name: 'Publication C'
  })

  await tap.test('Batch Update Publications - replace type', async () => {
    const res = await request(app)
      .patch(`/publications/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          publications: [pub1.shortId, pub2.shortId],
          operation: 'replace',
          property: 'type',
          value: 'Article'
        })
      )

    await tap.equal(res.status, 204)

    const getPub1 = await request(app)
      .get(`/publications/${pub1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const pub1Body = getPub1.body
    await tap.equal(pub1Body.type, 'Article')
    await tap.equal(pub1Body.name, 'Publication A')

    const getPub2 = await request(app)
      .get(`/publications/${pub2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const pub2Body = getPub2.body
    await tap.equal(pub2Body.type, 'Article')
    await tap.equal(pub2Body.name, 'Publication B')
  })

  await tap.test(
    'Batch Update Publications - replace genre (metadata)',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId, pub2.shortId],
            operation: 'replace',
            property: 'genre',
            value: 'new genre!'
          })
        )

      await tap.equal(res.status, 204)

      const getPub1 = await request(app)
        .get(`/publications/${pub1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const pub1Body = getPub1.body
      await tap.equal(pub1Body.genre, 'new genre!')
      await tap.equal(pub1Body.name, 'Publication A')

      const getPub2 = await request(app)
        .get(`/publications/${pub2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const pub2Body = getPub2.body
      await tap.equal(pub2Body.genre, 'new genre!')
      await tap.equal(pub2Body.name, 'Publication B')
    }
  )

  await tap.test(
    'Batch Update Publications - Try to replace an array property',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId, pub2.shortId],
            operation: 'replace',
            property: 'keywords',
            value: ['one', 'two']
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `Cannot use 'replace' to update an array property: keywords. Use 'add' or 'remove' instead`
      )
      await tap.equal(error.details.requestUrl, `/publications/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.operation, 'replace')
    }
  )

  await tap.test(
    'Batch Update Publications - replace with validation error',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId, pub2.shortId],
            operation: 'replace',
            property: 'name',
            value: 123
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `Validation Error on Batch Update Publication: name: should be string`
      )
      await tap.equal(error.details.requestUrl, `/publications/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.operation, 'replace')
    }
  )

  await tap.test(
    'Batch Update Publications - replace with validation error in metadata',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId, pub2.shortId],
            operation: 'replace',
            property: 'genre',
            value: 123
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Publication validation error: genre should be a string'
      )
      await tap.equal(error.details.requestUrl, `/publications/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.operation, 'replace')
    }
  )

  await tap.test(
    'Batch Update Publications - Try to replace with one publication that does not exist',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId, pub2.shortId + 'abc'],
            operation: 'replace',
            property: 'name',
            value: 'new name'
          })
        )

      await tap.equal(res.status, 207)
      const status = res.body.status
      await tap.equal(status[0].id, pub1.shortId)
      await tap.equal(status[0].status, 204)
      await tap.equal(status[1].id, pub2.shortId + 'abc')
      await tap.equal(status[1].status, 404)
      await tap.equal(
        status[1].message,
        `No Publication found with id ${pub2.shortId}abc`
      )
    }
  )

  await tap.test(
    'Batch Update Publications - Try to replace with both publications that do not exist',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId + 'abc', pub2.shortId + 'abc'],
            operation: 'replace',
            property: 'name',
            value: 'new name'
          })
        )

      await tap.equal(res.status, 207)
      const status = res.body.status
      await tap.equal(status[0].id, pub1.shortId + 'abc')
      await tap.equal(status[0].status, 404)
      await tap.equal(
        status[0].message,
        `No Publication found with id ${pub1.shortId}abc`
      )
      await tap.equal(status[1].id, pub2.shortId + 'abc')
      await tap.equal(status[1].status, 404)
      await tap.equal(
        status[1].message,
        `No Publication found with id ${pub2.shortId}abc`
      )
    }
  )

  // await tap.test('Batch Update Publications - add a keyword', async () => {

  //   const res = await request(app)
  //     .patch(`/publications/batchUpdate`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type('application/ld+json')
  //     .send(
  //       JSON.stringify({
  //         publications: [pub1.shortId, pub3.shortId],
  //         operation: 'add',
  //         property: 'keywords',
  //         value: ['three']
  //       })
  //     )

  //   await tap.equal(res.status, 200)
  //   const status = res.body.status
  //   await res.equal(status.length, 2)
  //   const index1 = _.findIndex(status, {publicationId: pub1.shortId})
  //   await res.equal(status[index1].statusCode, 200)
  //   await res.equal(status[index1].body.shortId, pub1.shortId)
  //   await res.equal(status[index1].keywords.length, 3)
  //   await res.ok(_.find(status[index1].keywords, 'one'))
  //   await res.ok(_.find(status[index1].keywords, 'two'))
  //   await res.ok(_.find(status[index1].keywords, 'three'))

  //   const index3 = _.findIndex(status, {publicationId: pub3.shortId})
  //   await res.equal(status[index3].statusCode, 200)
  //   await res.equal(status[index3].body.shortId, pub3.shortId)
  //   await res.equal(status[index3].keywords.length, 1)
  //   await res.equal(status[index3].keywords[0], 'three')
  // })

  // await tap.test('Batch Update Publications - remove a keyword', async () => {

  //   const res = await request(app)
  //     .patch(`/publications/batchUpdate`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type('application/ld+json')
  //     .send(
  //       JSON.stringify({
  //         publications: [pub1.shortId, pub2.shortId],
  //         operation: 'remove',
  //         property: 'keywords',
  //         value: ['one', 'two']
  //       })
  //     )

  //   await tap.equal(res.status, 200)
  //   const status = res.body.status
  //   await res.equal(status.length, 2)
  //   const index1 = _.findIndex(status, {publicationId: pub1.shortId})
  //   await res.equal(status[index1].statusCode, 200)
  //   await res.equal(status[index1].body.shortId, pub1.shortId)
  //   await res.equal(status[index1].keywords.length, 1)
  //   await res.equal(status[index1].keywords[0], 'three')
  //   await res.ok(_.find(status[index1].keywords, ''))
  //   await res.ok(_.find(status[index1].keywords, 'two'))
  //   await res.ok(_.find(status[index1].keywords, 'three'))

  //   const index2 = _.findIndex(status, {publicationId: pub2.shortId})
  //   await res.equal(status[index2].statusCode, 200)
  //   await res.equal(status[index2].body.shortId, pub2.shortId)
  //   await res.equal(status[index2].keywords.length, 0)
  // })

  await destroyDB(app)
}

module.exports = test
