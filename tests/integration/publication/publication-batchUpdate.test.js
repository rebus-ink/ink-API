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
    name: 'Publication C',
    keywords: []
  })

  // ********************************** REPLACE ********************************

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
      await tap.equal(error.message, 'Cannot replace property keywords')
      await tap.equal(error.details.requestUrl, `/publications/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.operation, 'replace')
    }
  )

  await tap.test(
    'Batch Update Publications - Try to replace a property that cannot be changed with batch updates',
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
            value: 'new name'
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.message, 'Cannot replace property name')
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
            property: 'type',
            value: 123
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `Publication validation error: 123 is not a valid type.`
      )
      await tap.equal(error.details.requestUrl, `/publications/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.operation, 'replace')
    }
  )

  await tap.test(
    'Batch Update Publications - replace with (built-in) validation error',
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
            property: 'encodingFormat',
            value: 123
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Validation Error on Batch Update Publication: encodingFormat: should be string,null'
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
            property: 'type',
            value: 'Book'
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
            property: 'type',
            value: 'Book'
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

  // ******************************** ADD - keywords, inLanguage *****************************

  await tap.test('Batch Update Publications - add a keyword', async () => {
    const res = await request(app)
      .patch(`/publications/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          publications: [pub1.shortId, pub3.shortId],
          operation: 'add',
          property: 'keywords',
          value: ['three']
        })
      )

    await tap.equal(res.status, 204)

    const getPub1 = await request(app)
      .get(`/publications/${pub1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const pub1Body = getPub1.body
    await tap.equal(pub1Body.keywords[0], 'one')
    await tap.equal(pub1Body.keywords[1], 'two')
    await tap.equal(pub1Body.keywords[2], 'three')
    await tap.equal(pub1Body.name, 'Publication A')

    const getPub3 = await request(app)
      .get(`/publications/${pub3.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const pub3Body = getPub3.body
    await tap.equal(pub3Body.keywords[0], 'three')
    await tap.equal(pub3Body.name, 'Publication C')
  })

  await tap.test(
    'Batch Update Publications - add a keyword, including one pub that already has the keyword',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId, pub2.shortId],
            operation: 'add',
            property: 'keywords',
            value: ['three']
          })
        )

      await tap.equal(res.status, 204)

      const getPub1 = await request(app)
        .get(`/publications/${pub1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const pub1Body = getPub1.body
      await tap.equal(pub1Body.keywords.length, 3)
      await tap.equal(pub1Body.keywords[0], 'one')
      await tap.equal(pub1Body.keywords[1], 'two')
      await tap.equal(pub1Body.keywords[2], 'three')
      await tap.equal(pub1Body.name, 'Publication A')

      const getPub2 = await request(app)
        .get(`/publications/${pub2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const pub2Body = getPub2.body
      await tap.equal(pub2Body.keywords.length, 2)
      await tap.equal(pub2Body.keywords[0], 'one')
      await tap.equal(pub2Body.keywords[1], 'three')
      await tap.equal(pub2Body.name, 'Publication B')
    }
  )

  await tap.test('Batch Update Publications - add a language', async () => {
    const res = await request(app)
      .patch(`/publications/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          publications: [pub1.shortId, pub2.shortId],
          operation: 'add',
          property: 'inLanguage',
          value: ['fr']
        })
      )

    await tap.equal(res.status, 204)

    const getPub1 = await request(app)
      .get(`/publications/${pub1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const pub1Body = getPub1.body

    await tap.equal(pub1Body.inLanguage.length, 1)
    await tap.equal(pub1Body.inLanguage[0], 'fr')
    await tap.equal(pub1Body.name, 'Publication A')

    const getPub2 = await request(app)
      .get(`/publications/${pub2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const pub2Body = getPub2.body
    await tap.equal(pub2Body.inLanguage.length, 1)
    await tap.equal(pub1Body.inLanguage[0], 'fr')
    await tap.equal(pub2Body.name, 'Publication B')
  })

  await tap.test(
    'Try to batch update keyword with validation error',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId, pub2.shortId],
            operation: 'add',
            property: 'keywords',
            value: 123
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'keywords should be a string or an array of strings'
      )
      await tap.equal(error.details.requestUrl, `/publications/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.operation, 'add')
    }
  )

  // ***************************************** REMOVE keyword, language ******************************

  await tap.test('Batch Update Publications - remove a keyword', async () => {
    // before:
    // 1: 'one', 'two', 'three'
    // 2: 'one', 'three'

    const res = await request(app)
      .patch(`/publications/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          publications: [pub1.shortId, pub2.shortId],
          operation: 'remove',
          property: 'keywords',
          value: ['one', 'two']
        })
      )

    await tap.equal(res.status, 204)

    const res1 = await request(app)
      .get(`/publications/${pub1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const keywords1 = res1.body.keywords
    await tap.equal(keywords1.length, 1)
    await tap.equal(keywords1[0], 'three')

    const res2 = await request(app)
      .get(`/publications/${pub2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const keywords2 = res2.body.keywords
    await tap.equal(keywords2.length, 1)
    await tap.equal(keywords2[0], 'three')
  })

  await tap.test(
    'Batch Update Publications - remove a keyword with one pub not found',
    async () => {
      // before:
      // 1: 'one', 'two', 'three'
      // 2: 'one', 'three'

      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId + 'abc', pub2.shortId],
            operation: 'remove',
            property: 'keywords',
            value: ['three']
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body
      await tap.equal(result.length, 2)
      await tap.equal(result[0].status, 404)
      await tap.equal(result[0].id, pub1.shortId + 'abc')
      await tap.equal(
        result[0].message,
        `No Publication found with id ${pub1.shortId}abc`
      )
      await tap.equal(result[1].status, 204)
      await tap.equal(result[1].id, pub2.shortId)

      const res1 = await request(app)
        .get(`/publications/${pub1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const keywords1 = res1.body.keywords
      await tap.equal(keywords1.length, 1)
      await tap.equal(keywords1[0], 'three')

      const res2 = await request(app)
        .get(`/publications/${pub2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const keywords2 = res2.body.keywords
      await tap.equal(keywords2.length, 0)
    }
  )

  // ********************************************** ADD ATTRIBUTIONS **********************************

  /*
  before:
  1: author: 'John Smith'
     editor: 'Jane S. Doe'

  2: author: 'John Smith'
     contributor: 'Contributor1', 'Contributor2'
     editor: 'generic editor'

  3: author: 'generic author'
     editor: 'generic editor'

   */

  await tap.test('Batch Update Publications - add an attribution', async () => {
    const res = await request(app)
      .patch(`/publications/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          publications: [pub1.shortId, pub3.shortId],
          operation: 'add',
          property: 'author',
          value: ['Author1']
        })
      )

    await tap.equal(res.status, 204)

    const getPub1 = await request(app)
      .get(`/publications/${pub1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const pub1Body = getPub1.body
    await tap.equal(pub1Body.author.length, 2)
    await tap.equal(pub1Body.author[1].name, 'John Smith')
    await tap.equal(pub1Body.author[0].name, 'Author1')
    await tap.equal(pub1Body.name, 'Publication A')

    const getPub3 = await request(app)
      .get(`/publications/${pub3.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const pub3Body = getPub3.body
    await tap.equal(pub3Body.author[1].name, 'generic author')
    await tap.equal(pub3Body.author[0].name, 'Author1')
    await tap.equal(pub3Body.name, 'Publication C')
  })

  /*
  before:
  1: author: 'John Smith', 'Author1'
     editor: 'Jane S. Doe'

  2: author: 'John Smith'
     contributor: 'Contributor1', 'Contributor2'
     editor: 'generic editor'

  3: author: 'generic author', 'Author1'
     editor: 'generic editor'

   */

  await tap.test(
    'Batch Update Publications - add an attribution that already exists for one pub',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId, pub2.shortId],
            operation: 'add',
            property: 'author',
            value: ['author1'] // when checking if already exists, is not case sensitive
          })
        )

      await tap.equal(res.status, 204)

      const getPub1 = await request(app)
        .get(`/publications/${pub1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const pub1Body = getPub1.body
      await tap.equal(pub1Body.author.length, 2)
      await tap.equal(pub1Body.author[1].name, 'John Smith')
      await tap.equal(pub1Body.author[0].name, 'Author1')
      await tap.equal(pub1Body.name, 'Publication A')

      const getPub2 = await request(app)
        .get(`/publications/${pub2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const pub2Body = getPub2.body
      await tap.equal(pub2Body.author[1].name, 'John Smith')
      await tap.equal(pub2Body.author[0].name, 'author1')
      await tap.equal(pub2Body.name, 'Publication B')
    }
  )

  await tap.test(
    'Batch Update Publications - add a new type of attribution',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId, pub2.shortId],
            operation: 'add',
            property: 'illustrator',
            value: ['illustrator1']
          })
        )

      await tap.equal(res.status, 204)

      const getPub1 = await request(app)
        .get(`/publications/${pub1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const pub1Body = getPub1.body
      await tap.equal(pub1Body.illustrator.length, 1)
      await tap.equal(pub1Body.illustrator[0].name, 'illustrator1')
      await tap.equal(pub1Body.name, 'Publication A')

      const getPub2 = await request(app)
        .get(`/publications/${pub2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const pub2Body = getPub2.body
      await tap.equal(pub2Body.illustrator[0].name, 'illustrator1')
      await tap.equal(pub2Body.name, 'Publication B')
    }
  )

  await tap.test(
    'Batch Update Publications - try to add an attribution with validation error',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId, pub2.shortId],
            operation: 'add',
            property: 'illustrator',
            value: 123
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body
      await tap.equal(result[0].status, 400)
      await tap.equal(result[0].id, pub1.shortId)
      await tap.equal(
        result[0].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )

      await tap.equal(result[1].status, 400)
      await tap.equal(result[1].id, pub2.shortId)
      await tap.equal(
        result[1].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
    }
  )

  await tap.test(
    'Batch Update Publications - try to add an attribution with multiple validation errors',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId, pub2.shortId],
            operation: 'add',
            property: 'illustrator',
            value: [123, 456]
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body

      await tap.equal(result.length, 4)

      await tap.equal(result[0].status, 400)
      await tap.equal(result[0].id, pub1.shortId)
      await tap.equal(
        result[0].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(result[0].value, 123)

      await tap.equal(result[1].status, 400)
      await tap.equal(result[1].id, pub1.shortId)
      await tap.equal(
        result[1].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(result[1].value, 456)

      await tap.equal(result[2].status, 400)
      await tap.equal(result[2].id, pub2.shortId)
      await tap.equal(
        result[2].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(result[2].value, 123)

      await tap.equal(result[3].status, 400)
      await tap.equal(result[3].id, pub2.shortId)
      await tap.equal(
        result[3].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(result[3].value, 456)
    }
  )

  await tap.test(
    'Batch Update Publications - try to add an attribution with validation error on some items',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            publications: [pub1.shortId, pub2.shortId],
            operation: 'add',
            property: 'illustrator',
            value: [123, 'illustrator2']
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body

      await tap.equal(result.length, 4)

      await tap.equal(result[0].status, 400)
      await tap.equal(result[0].id, pub1.shortId)
      await tap.equal(
        result[0].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(result[0].value, 123)

      await tap.equal(result[1].status, 204)
      await tap.equal(result[1].id, pub1.shortId)
      await tap.equal(result[1].value, 'illustrator2')

      await tap.equal(result[2].status, 400)
      await tap.equal(result[2].id, pub2.shortId)
      await tap.equal(
        result[2].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(result[2].value, 123)

      await tap.equal(result[3].status, 204)
      await tap.equal(result[3].id, pub2.shortId)
      await tap.equal(result[3].value, 'illustrator2')
    }
  )

  // *********************************************** GENERAL ERRORS ***********************************

  await tap.test('Try to batch update with empty body', async () => {
    const res = await request(app)
      .patch(`/publications/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify({}))

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Batch Update Publication Request Error: Body must be a JSON object'
    )
    await tap.equal(error.details.requestUrl, `/publications/batchUpdate`)
    await tap.type(error.details.requestBody, 'object')
  })

  await tap.test(
    'Try to batch update with body missing properties',
    async () => {
      const res = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify({ property: 'keywords' }))

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Batch Update Publication Request Error: Body missing properties: value,operation,publications '
      )
      await tap.equal(error.details.requestUrl, `/publications/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
    }
  )

  await destroyDB(app)
}

module.exports = test
