const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createTag,
  addSourceToCollection
} = require('../../utils/testUtils')
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const source1 = await createSource(app, token, {
    type: 'Book',
    name: 'Source A',
    author: ['John Smith'],
    editor: 'Jané S. Doe',
    contributor: ['Sample Contributor'],
    bookFormat: 'EBook',
    keywords: ['one', 'two'],
    translator: ['translator1', 'translator2', 'translator3']
  })

  const source2 = await createSource(app, token, {
    type: 'Book',
    name: 'Source B',
    author: ['John Smith'],
    contributor: ['Contributor1', 'Contributor2'],
    bookFormat: 'EBook',
    keywords: ['one'],
    translator: ['translator1', 'translator2']
  })

  const source3 = await createSource(app, token, {
    type: 'Book',
    name: 'Source C',
    keywords: []
  })

  const tag1 = await createTag(app, token, { type: 'type1', name: 'tag1' })
  const tag2 = await createTag(app, token, { type: 'type1', name: 'tag2' })
  const tag3 = await createTag(app, token, { type: 'type2', name: 'tag3' })
  const tag4 = await createTag(app, token, { type: 'type1', name: 'tag4' })
  const tag5 = await createTag(app, token, { type: 'type1', name: 'tag5' })

  // source1: tag 1, 2, 3
  await addSourceToCollection(app, token, source1.shortId, tag1.shortId)
  await addSourceToCollection(app, token, source1.shortId, tag2.shortId)
  await addSourceToCollection(app, token, source1.shortId, tag3.shortId)

  // source2: tag 1
  await addSourceToCollection(app, token, source2.shortId, tag1.shortId)

  // source3: not tags

  // ********************************** REPLACE ********************************

  await tap.test('Batch Update Sources - replace type', async () => {
    const res = await request(app)
      .patch(`/sources/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          sources: [source1.shortId, source2.shortId],
          operation: 'replace',
          property: 'type',
          value: 'Article'
        })
      )

    await tap.equal(res.status, 204)

    const getSource1 = await request(app)
      .get(`/sources/${source1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source1Body = getSource1.body
    await tap.equal(source1Body.type, 'Article')
    await tap.equal(source1Body.name, 'Source A')

    const getSource2 = await request(app)
      .get(`/sources/${source2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source2Body = getSource2.body
    await tap.equal(source2Body.type, 'Article')
    await tap.equal(source2Body.name, 'Source B')
  })

  await tap.test(
    'Batch Update Sources - Try to replace an array property',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
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
      await tap.equal(error.details.requestUrl, `/sources/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.operation, 'replace')
    }
  )

  await tap.test(
    'Batch Update Sources - Try to replace a property that cannot be changed with batch updates',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
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
      await tap.equal(error.details.requestUrl, `/sources/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.operation, 'replace')
    }
  )

  await tap.test(
    'Batch Update Sources - replace with validation error',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
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
        `Source validation error: 123 is not a valid type.`
      )
      await tap.equal(error.details.requestUrl, `/sources/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.operation, 'replace')
    }
  )

  await tap.test(
    'Batch Update Sources - replace with (built-in) validation error',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
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
        'Validation Error on Batch Update Source: encodingFormat: should be string,null'
      )
      await tap.equal(error.details.requestUrl, `/sources/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.operation, 'replace')
    }
  )

  await tap.test(
    'Batch Update Sources - Try to replace with one source that does not exist',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId + 'abc'],
            operation: 'replace',
            property: 'type',
            value: 'Book'
          })
        )

      await tap.equal(res.status, 207)
      const status = res.body.status
      await tap.equal(status[0].id, source1.shortId)
      await tap.equal(status[0].status, 204)
      await tap.equal(status[1].id, source2.shortId + 'abc')
      await tap.equal(status[1].status, 404)
      await tap.equal(
        status[1].message,
        `No Source found with id ${source2.shortId}abc`
      )
    }
  )

  await tap.test(
    'Batch Update Sources - Try to replace with both sources that do not exist',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId + 'abc', source2.shortId + 'abc'],
            operation: 'replace',
            property: 'type',
            value: 'Book'
          })
        )

      await tap.equal(res.status, 207)
      const status = res.body.status
      await tap.equal(status[0].id, source1.shortId + 'abc')
      await tap.equal(status[0].status, 404)
      await tap.equal(
        status[0].message,
        `No Source found with id ${source1.shortId}abc`
      )
      await tap.equal(status[1].id, source2.shortId + 'abc')
      await tap.equal(status[1].status, 404)
      await tap.equal(
        status[1].message,
        `No Source found with id ${source2.shortId}abc`
      )
    }
  )

  // ******************************** ADD - keywords, inLanguage *****************************

  await tap.test('Batch Update Sources - add a keyword', async () => {
    const res = await request(app)
      .patch(`/sources/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          sources: [source1.shortId, source3.shortId],
          operation: 'add',
          property: 'keywords',
          value: ['three']
        })
      )

    await tap.equal(res.status, 204)

    const getSource1 = await request(app)
      .get(`/sources/${source1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source1Body = getSource1.body
    await tap.equal(source1Body.keywords[0], 'one')
    await tap.equal(source1Body.keywords[1], 'two')
    await tap.equal(source1Body.keywords[2], 'three')
    await tap.equal(source1Body.name, 'Source A')

    const getSource3 = await request(app)
      .get(`/sources/${source3.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source3Body = getSource3.body
    await tap.equal(source3Body.keywords[0], 'three')
    await tap.equal(source3Body.name, 'Source C')
  })

  await tap.test(
    'Batch Update Sources - add a keyword, including one source that already has the keyword',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
            operation: 'add',
            property: 'keywords',
            value: ['three']
          })
        )

      await tap.equal(res.status, 204)

      const getSource1 = await request(app)
        .get(`/sources/${source1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source1Body = getSource1.body
      await tap.equal(source1Body.keywords.length, 3)
      await tap.equal(source1Body.keywords[0], 'one')
      await tap.equal(source1Body.keywords[1], 'two')
      await tap.equal(source1Body.keywords[2], 'three')
      await tap.equal(source1Body.name, 'Source A')

      const getSource2 = await request(app)
        .get(`/sources/${source2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source2Body = getSource2.body
      await tap.equal(source2Body.keywords.length, 2)
      await tap.equal(source2Body.keywords[0], 'one')
      await tap.equal(source2Body.keywords[1], 'three')
      await tap.equal(source2Body.name, 'Source B')
    }
  )

  await tap.test('Batch Update Sources - add a language', async () => {
    const res = await request(app)
      .patch(`/sources/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          sources: [source1.shortId, source2.shortId],
          operation: 'add',
          property: 'inLanguage',
          value: ['fr']
        })
      )

    await tap.equal(res.status, 204)

    const getSource1 = await request(app)
      .get(`/sources/${source1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source1Body = getSource1.body

    await tap.equal(source1Body.inLanguage.length, 1)
    await tap.equal(source1Body.inLanguage[0], 'fr')
    await tap.equal(source1Body.name, 'Source A')

    const getSource2 = await request(app)
      .get(`/sources/${source2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source2Body = getSource2.body
    await tap.equal(source2Body.inLanguage.length, 1)
    await tap.equal(source1Body.inLanguage[0], 'fr')
    await tap.equal(source2Body.name, 'Source B')
  })

  await tap.test(
    'Try to batch update keyword with validation error',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
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
      await tap.equal(error.details.requestUrl, `/sources/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.operation, 'add')
    }
  )

  // ***************************************** REMOVE keyword, language ******************************

  await tap.test('Batch Update Sources - remove a keyword', async () => {
    // before:
    // 1: 'one', 'two', 'three'
    // 2: 'one', 'three'

    const res = await request(app)
      .patch(`/sources/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          sources: [source1.shortId, source2.shortId],
          operation: 'remove',
          property: 'keywords',
          value: ['one', 'two']
        })
      )

    await tap.equal(res.status, 204)

    const res1 = await request(app)
      .get(`/sources/${source1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const keywords1 = res1.body.keywords
    await tap.equal(keywords1.length, 1)
    await tap.equal(keywords1[0], 'three')

    const res2 = await request(app)
      .get(`/sources/${source2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const keywords2 = res2.body.keywords
    await tap.equal(keywords2.length, 1)
    await tap.equal(keywords2[0], 'three')
  })

  await tap.test(
    'Batch Update Sources - remove a keyword with one source not found',
    async () => {
      // before:
      // 1: 'one', 'two', 'three'
      // 2: 'one', 'three'

      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId + 'abc', source2.shortId],
            operation: 'remove',
            property: 'keywords',
            value: ['three']
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body.status
      await tap.equal(result.length, 2)
      await tap.equal(result[0].status, 404)
      await tap.equal(result[0].id, source1.shortId + 'abc')
      await tap.equal(
        result[0].message,
        `No Source found with id ${source1.shortId}abc`
      )
      await tap.equal(result[1].status, 204)
      await tap.equal(result[1].id, source2.shortId)

      const res1 = await request(app)
        .get(`/sources/${source1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const keywords1 = res1.body.keywords
      await tap.equal(keywords1.length, 1)
      await tap.equal(keywords1[0], 'three')

      const res2 = await request(app)
        .get(`/sources/${source2.shortId}`)
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
     translator: 'translator1', 'translator2', 'translator3'

  2: author: 'John Smith'
     contributor: 'Contributor1', 'Contributor2'
     editor: 'generic editor'
    translator: 'translator1', 'translator2'

  3: author: 'generic author'
     editor: 'generic editor'

   */

  await tap.test('Batch Update Sources - add an attribution', async () => {
    const res = await request(app)
      .patch(`/sources/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          sources: [source1.shortId, source3.shortId],
          operation: 'add',
          property: 'author',
          value: ['Author1']
        })
      )

    await tap.equal(res.status, 204)

    const getSource1 = await request(app)
      .get(`/sources/${source1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source1Body = getSource1.body
    await tap.equal(source1Body.author.length, 2)
    await tap.equal(source1Body.author[1].name, 'John Smith')
    await tap.equal(source1Body.author[0].name, 'Author1')
    await tap.equal(source1Body.name, 'Source A')

    const getSource3 = await request(app)
      .get(`/sources/${source3.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source3Body = getSource3.body
    await tap.equal(source3Body.author[1].name, 'generic author')
    await tap.equal(source3Body.author[0].name, 'Author1')
    await tap.equal(source3Body.name, 'Source C')
  })

  /*
  before:
  1: author: 'John Smith', 'Author1'
     editor: 'Jane S. Doe'
     translator: 'translator1', 'translator2', 'translator3'

  2: author: 'John Smith'
     contributor: 'Contributor1', 'Contributor2'
     editor: 'generic editor'
     translator: 'translator1', 'translator2'

  3: author: 'generic author', 'Author1'
     editor: 'generic editor'

   */

  await tap.test(
    'Batch Update Sources - add an attribution that already exists for one source',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
            operation: 'add',
            property: 'author',
            value: ['author1'] // when checking if already exists, is not case sensitive
          })
        )

      await tap.equal(res.status, 204)

      const getSource1 = await request(app)
        .get(`/sources/${source1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source1Body = getSource1.body
      await tap.equal(source1Body.author.length, 2)
      await tap.equal(source1Body.author[1].name, 'John Smith')
      await tap.equal(source1Body.author[0].name, 'Author1')
      await tap.equal(source1Body.name, 'Source A')

      const getSource2 = await request(app)
        .get(`/sources/${source2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source2Body = getSource2.body
      await tap.equal(source2Body.author[1].name, 'John Smith')
      await tap.equal(source2Body.author[0].name, 'author1')
      await tap.equal(source2Body.name, 'Source B')
    }
  )

  await tap.test(
    'Batch Update Sources - add a new type of attribution',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
            operation: 'add',
            property: 'illustrator',
            value: ['illustrator1']
          })
        )

      await tap.equal(res.status, 204)

      const getSource1 = await request(app)
        .get(`/sources/${source1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source1Body = getSource1.body
      await tap.equal(source1Body.illustrator.length, 1)
      await tap.equal(source1Body.illustrator[0].name, 'illustrator1')
      await tap.equal(source1Body.name, 'Source A')

      const getSource2 = await request(app)
        .get(`/sources/${source2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source2Body = getSource2.body
      await tap.equal(source2Body.illustrator[0].name, 'illustrator1')
      await tap.equal(source2Body.name, 'Source B')
    }
  )

  await tap.test(
    'Batch Update Sources - try to add an attribution with validation error',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
            operation: 'add',
            property: 'illustrator',
            value: 123
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body.status
      await tap.equal(result[0].status, 400)
      await tap.equal(result[0].id, source1.shortId)
      await tap.equal(
        result[0].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )

      await tap.equal(result[1].status, 400)
      await tap.equal(result[1].id, source2.shortId)
      await tap.equal(
        result[1].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
    }
  )

  await tap.test(
    'Batch Update Sources - try to add an attribution with multiple validation errors',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
            operation: 'add',
            property: 'illustrator',
            value: [123, 456]
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body.status

      await tap.equal(result.length, 4)

      await tap.equal(result[0].status, 400)
      await tap.equal(result[0].id, source1.shortId)
      await tap.equal(
        result[0].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(result[0].value, 123)

      await tap.equal(result[1].status, 400)
      await tap.equal(result[1].id, source1.shortId)
      await tap.equal(
        result[1].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(result[1].value, 456)

      await tap.equal(result[2].status, 400)
      await tap.equal(result[2].id, source2.shortId)
      await tap.equal(
        result[2].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(result[2].value, 123)

      await tap.equal(result[3].status, 400)
      await tap.equal(result[3].id, source2.shortId)
      await tap.equal(
        result[3].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(result[3].value, 456)
    }
  )

  await tap.test(
    'Batch Update Sources - try to add an attribution with validation error on some items',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source3.shortId],
            operation: 'add',
            property: 'illustrator',
            value: [123, 'illustrator2']
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body.status

      await tap.equal(result.length, 4)

      await tap.equal(result[0].status, 400)
      await tap.equal(result[0].id, source1.shortId)
      await tap.equal(
        result[0].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(result[0].value, 123)

      await tap.equal(result[1].status, 204)
      await tap.equal(result[1].id, source1.shortId)
      await tap.equal(result[1].value, 'illustrator2')

      await tap.equal(result[2].status, 400)
      await tap.equal(result[2].id, source3.shortId)
      await tap.equal(
        result[2].message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(result[2].value, 123)

      await tap.equal(result[3].status, 204)
      await tap.equal(result[3].id, source3.shortId)
      await tap.equal(result[3].value, 'illustrator2')
    }
  )

  /*
  before:
  1: author: 'John Smith', 'Author1'
     editor: 'Jane S. Doe'
     illustrator: 'illustrator1', 'illustrator2'
     translator: 'translator1', 'translator2', 'translator3'

  2: author: 'John Smith', 'author1
     contributor: 'Contributor1', 'Contributor2'
     editor: 'generic editor'
     illustrator: 'illustrator1'
     translator: 'translator1', 'translator2'

  3: author: 'generic author', 'Author1'
     editor: 'generic editor'
     illustrator: 'illustrator2'

   */

  // ********************************************* REMOVE ATTRIBUTIONS ********************************

  await tap.test('Batch Update Sources - remove an attribution', async () => {
    const res = await request(app)
      .patch(`/sources/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          sources: [source1.shortId, source2.shortId],
          operation: 'remove',
          property: 'author',
          value: ['Author1']
        })
      )

    await tap.equal(res.status, 204)

    const getSource1 = await request(app)
      .get(`/sources/${source1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source1Body = getSource1.body
    await tap.equal(source1Body.author.length, 1)
    await tap.equal(source1Body.author[0].name, 'John Smith')
    await tap.equal(source1Body.name, 'Source A')

    const getSource2 = await request(app)
      .get(`/sources/${source2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source2Body = getSource2.body
    await tap.equal(source2Body.author.length, 1)
    await tap.equal(source2Body.author[0].name, 'John Smith')
    await tap.equal(source2Body.name, 'Source B')
  })

  await tap.test(
    'Batch Update Sources - remove an attribution that does not exist',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
            operation: 'remove',
            property: 'author',
            value: ['Author123']
          })
        )

      await tap.equal(res.status, 204)

      const getSource1 = await request(app)
        .get(`/sources/${source1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source1Body = getSource1.body
      await tap.equal(source1Body.author.length, 1)
      await tap.equal(source1Body.author[0].name, 'John Smith')
      await tap.equal(source1Body.name, 'Source A')

      const getSource2 = await request(app)
        .get(`/sources/${source2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source2Body = getSource2.body
      await tap.equal(source2Body.author.length, 1)
      await tap.equal(source2Body.author[0].name, 'John Smith')
      await tap.equal(source2Body.name, 'Source B')
    }
  )

  /*
  before:
  1: author: 'John Smith'
     editor: 'Jane S. Doe'
     illustrator: 'illustrator1', 'illustrator2'
     translator: 'translator1', 'translator2', 'translator3'

  2: author: 'John Smith'
     contributor: 'Contributor1', 'Contributor2'
     editor: 'generic editor'
     illustrator: 'illustrator1'
     translator: 'translator1', 'translator2'

  3: author: 'generic author', 'Author1'
     editor: 'generic editor'
     illustrator: 'illustrator2'

   */

  await tap.test(
    'Batch Update Sources - remove an attribution that exists for some of the sources',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
            operation: 'remove',
            property: 'illustrator',
            value: ['illustrator2']
          })
        )

      await tap.equal(res.status, 204)

      const getSource1 = await request(app)
        .get(`/sources/${source1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source1Body = getSource1.body
      await tap.equal(source1Body.illustrator.length, 1)
      await tap.equal(source1Body.illustrator[0].name, 'illustrator1')
      await tap.equal(source1Body.name, 'Source A')

      const getSource2 = await request(app)
        .get(`/sources/${source2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source2Body = getSource2.body
      await tap.equal(source2Body.illustrator.length, 1)
      await tap.equal(source2Body.illustrator[0].name, 'illustrator1')
      await tap.equal(source2Body.name, 'Source B')
    }
  )

  /*
  before:
  1: author: 'John Smith'
     editor: 'Jane S. Doe'
     illustrator: 'illustrator1'
     translator: 'translator1', 'translator2', 'translator3'

  2: author: 'John Smith'
     contributor: 'Contributor1', 'Contributor2'
     editor: 'generic editor'
     illustrator: 'illustrator1'
     translator: 'translator1', 'translator2'

  3: author: 'generic author', 'Author1'
     editor: 'generic editor'
     illustrator: 'illustrator2'

   */

  await tap.test(
    'Batch Update Sources - remove an attribution to a source that exists and one that does not',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source3.shortId, source2.shortId + 'abc'],
            operation: 'remove',
            property: 'editor',
            value: ['generic editor']
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body.status
      await tap.equal(result.length, 2)
      await tap.equal(result[0].id, source3.shortId)
      await tap.equal(result[0].status, 204)
      await tap.equal(result[0].value, 'generic editor')
      await tap.equal(result[1].id, source2.shortId + 'abc')
      await tap.equal(result[1].status, 404)
      await tap.equal(
        result[1].message,
        `No Source found with id ${source2.shortId}abc`
      )

      const getSource3 = await request(app)
        .get(`/sources/${source3.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source3Body = getSource3.body
      await tap.equal(source3Body.editor.length, 0)
    }
  )

  /*
  before:
  1: author: 'John Smith'
     editor: 'Jane S. Doe'
     illustrator: 'illustrator1'
     translator: 'translator1', 'translator2', 'translator3'

  2: author: 'John Smith'
     contributor: 'Contributor1', 'Contributor2'
     editor: 'generic editor'
     illustrator: 'illustrator1'
     translator: 'translator1', 'translator2'

  3: author: 'generic author', 'Author1'
     editor:
     illustrator: 'illustrator2'

   */

  await tap.test('Batch Update Sources - remove two attributions', async () => {
    const res = await request(app)
      .patch(`/sources/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          sources: [source1.shortId, source2.shortId],
          operation: 'remove',
          property: 'translator',
          value: ['translator1', 'translator2']
        })
      )

    await tap.equal(res.status, 204)

    const getSource1 = await request(app)
      .get(`/sources/${source1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source1Body = getSource1.body
    await tap.equal(source1Body.translator.length, 1)
    await tap.equal(source1Body.translator[0].name, 'translator3')
    await tap.equal(source1Body.name, 'Source A')

    const getSource2 = await request(app)
      .get(`/sources/${source2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source2Body = getSource2.body
    await tap.equal(source2Body.translator.length, 0)
    await tap.equal(source2Body.name, 'Source B')
  })

  await tap.test(
    'Batch Update Sources - try to remove attribution with invalid values',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
            operation: 'remove',
            property: 'translator',
            value: [123, 456]
          })
        )
      await tap.equal(res.status, 207)
      const status = res.body.status
      await tap.equal(status.length, 4)

      await tap.equal(status[0].id, source1.shortId)
      await tap.equal(status[0].value, 123)
      await tap.equal(status[0].status, 400)
      await tap.equal(
        status[0].message,
        'Values for translator must be strings'
      )

      await tap.equal(status[1].id, source2.shortId)
      await tap.equal(status[1].value, 123)
      await tap.equal(status[1].status, 400)
      await tap.equal(
        status[1].message,
        'Values for translator must be strings'
      )

      await tap.equal(status[2].id, source1.shortId)
      await tap.equal(status[2].value, 456)
      await tap.equal(status[2].status, 400)
      await tap.equal(
        status[2].message,
        'Values for translator must be strings'
      )

      await tap.equal(status[3].id, source2.shortId)
      await tap.equal(status[3].value, 456)
      await tap.equal(status[3].status, 400)
      await tap.equal(
        status[3].message,
        'Values for translator must be strings'
      )
    }
  )

  /*
  before:
  1: author: 'John Smith'
     editor: 'Jane S. Doe'
     illustrator: 'illustrator1'
     translator: 'translator3'

  2: author: 'John Smith'
     contributor: 'Contributor1', 'Contributor2'
     editor: 'generic editor'
     illustrator: 'illustrator1'

  3: author: 'generic author', 'Author1'
     editor:
     illustrator: 'illustrator2'

   */

  await tap.test(
    'Batch Update Sources - remove attribution with invalid values and valid values',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source2.shortId],
            operation: 'remove',
            property: 'translator',
            value: [123, 'translator3']
          })
        )

      await tap.equal(res.status, 207)
      const status = res.body.status
      await tap.equal(status.length, 4)

      await tap.equal(status[0].id, source1.shortId)
      await tap.equal(status[0].value, 'translator3')
      await tap.equal(status[0].status, 204)

      await tap.equal(status[1].id, source2.shortId)
      await tap.equal(status[1].value, 'translator3')
      await tap.equal(status[1].status, 204)

      await tap.equal(status[2].id, source1.shortId)
      await tap.equal(status[2].value, 123)
      await tap.equal(status[2].status, 400)
      await tap.equal(
        status[2].message,
        'Values for translator must be strings'
      )

      await tap.equal(status[3].id, source2.shortId)
      await tap.equal(status[3].value, 123)
      await tap.equal(status[3].status, 400)
      await tap.equal(
        status[3].message,
        'Values for translator must be strings'
      )
    }
  )

  /*
  before:
  source1: tag1, tag2, tag3
  source2: tag1
  source3:
  */

  // ************************************************ ADD TAGS ****************************************

  await tap.test('Batch Update Sources - add a tag', async () => {
    const res = await request(app)
      .patch(`/sources/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          sources: [source2.shortId, source3.shortId],
          operation: 'add',
          property: 'tags',
          value: [tag2.shortId]
        })
      )

    await tap.equal(res.status, 204)

    const getSource2 = await request(app)
      .get(`/sources/${source2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source2Tags = getSource2.body.tags
    await tap.equal(source2Tags.length, 2)
    await tap.ok(_.find(source2Tags, { name: 'tag1' }))
    await tap.ok(_.find(source2Tags, { name: 'tag2' }))

    const getSource3 = await request(app)
      .get(`/sources/${source3.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source3Body = getSource3.body
    await tap.equal(source3Body.tags.length, 1)
    await tap.equal(source3Body.tags[0].name, 'tag2')
  })

  /*
  before:
  source1: tag1, tag2, tag3
  source2: tag1, tag2
  source3: tag2
  */

  await tap.test(
    'Batch Update Sources - add a tag that already exists',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source3.shortId],
            operation: 'add',
            property: 'tags',
            value: [tag3.shortId]
          })
        )

      await tap.equal(res.status, 204)

      const getSource1 = await request(app)
        .get(`/sources/${source1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source1Tags = getSource1.body.tags
      await tap.equal(source1Tags.length, 3)
      await tap.ok(_.find(source1Tags, { name: 'tag1' }))
      await tap.ok(_.find(source1Tags, { name: 'tag2' }))
      await tap.ok(_.find(source1Tags, { name: 'tag3' }))

      const getSource3 = await request(app)
        .get(`/sources/${source3.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source3Tags = getSource3.body.tags
      await tap.equal(source3Tags.length, 2)
      await tap.ok(_.find(source3Tags, { name: 'tag2' }))
      await tap.ok(_.find(source3Tags, { name: 'tag3' }))
    }
  )

  /*
before:
source1: tag1, tag2, tag3
source2: tag1
source3: tag2, tag3
*/

  await tap.test('Batch Update Sources - add nultiple tags', async () => {
    const res = await request(app)
      .patch(`/sources/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          sources: [source1.shortId, source3.shortId],
          operation: 'add',
          property: 'tags',
          value: [tag4.shortId, tag5.shortId]
        })
      )

    await tap.equal(res.status, 204)

    const getSource1 = await request(app)
      .get(`/sources/${source1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source1Tags = getSource1.body.tags
    await tap.equal(source1Tags.length, 5)
    await tap.ok(_.find(source1Tags, { name: 'tag1' }))
    await tap.ok(_.find(source1Tags, { name: 'tag2' }))
    await tap.ok(_.find(source1Tags, { name: 'tag3' }))
    await tap.ok(_.find(source1Tags, { name: 'tag4' }))
    await tap.ok(_.find(source1Tags, { name: 'tag5' }))

    const getSource3 = await request(app)
      .get(`/sources/${source3.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source3Tags = getSource3.body.tags
    await tap.equal(source3Tags.length, 4)
    await tap.ok(_.find(source3Tags, { name: 'tag2' }))
    await tap.ok(_.find(source3Tags, { name: 'tag3' }))
    await tap.ok(_.find(source3Tags, { name: 'tag4' }))
    await tap.ok(_.find(source3Tags, { name: 'tag5' }))
  })

  /*
before:
source1: tag1, tag2, tag3, tag4, tag5
source2: tag1
source3: tag2, tag3, tag4, tag5
*/

  await tap.test(
    'Batch Update Sources - try to add a tag that doesn not exist',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source1.shortId, source3.shortId],
            operation: 'add',
            property: 'tags',
            value: [tag4.shortId + 'abc']
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body.status
      await tap.equal(result.length, 2)
      await tap.equal(result[0].status, 404)
      await tap.equal(result[0].id, source1.shortId)
      await tap.equal(result[0].value, tag4.shortId + 'abc')
      await tap.equal(
        result[0].message,
        `No Tag found with id ${tag4.shortId}abc`
      )

      await tap.equal(result[1].status, 404)
      await tap.equal(result[1].id, source3.shortId)
      await tap.equal(result[1].value, tag4.shortId + 'abc')
      await tap.equal(
        result[1].message,
        `No Tag found with id ${tag4.shortId}abc`
      )
    }
  )

  /*
before:
source1: tag1, tag2, tag3, tag4, tag5
source2: tag1
source3: tag2, tag3, tag4, tag5
*/

  await tap.test(
    'Batch Update Sources - try to add two tags: one that exists and one that does not',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source2.shortId, source3.shortId],
            operation: 'add',
            property: 'tags',
            value: [tag4.shortId + 'abc', tag5.shortId]
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body.status
      await tap.equal(result.length, 4)
      await tap.equal(result[0].status, 404)
      await tap.equal(result[0].id, source2.shortId)
      await tap.equal(result[0].value, tag4.shortId + 'abc')
      await tap.equal(
        result[0].message,
        `No Tag found with id ${tag4.shortId}abc`
      )

      await tap.equal(result[1].status, 204)
      await tap.equal(result[1].id, source2.shortId)
      await tap.equal(result[1].value, tag5.shortId)

      await tap.equal(result[2].status, 404)
      await tap.equal(result[2].id, source3.shortId)
      await tap.equal(result[2].value, tag4.shortId + 'abc')
      await tap.equal(
        result[2].message,
        `No Tag found with id ${tag4.shortId}abc`
      )

      await tap.equal(result[3].status, 204)
      await tap.equal(result[3].id, source3.shortId)
      await tap.equal(result[3].value, tag5.shortId)
    }
  )

  /*
before:
source1: tag1, tag2, tag3, tag4, tag5
source2: tag1, tag5
source3: tag2, tag3, tag4, tag5
*/

  await tap.test(
    'Batch Update Sources - try to add a tag to a source that does not exist',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source2.shortId + 'abc'],
            operation: 'add',
            property: 'tags',
            value: [tag5.shortId]
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body.status
      await tap.equal(result.length, 1)
      await tap.equal(result[0].status, 404)
      await tap.equal(result[0].id, source2.shortId + 'abc')
      await tap.equal(
        result[0].message,
        `No Source found with id ${source2.shortId}abc`
      )
    }
  )

  /*
before:
source1: tag1, tag2, tag3, tag4, tag5
source2: tag1, tag5
source3: tag2, tag3, tag4, tag5
*/

  await tap.test(
    'Batch Update Sources - try to add a tag to a source that does not exist and one that does',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source2.shortId, source1.shortId + 'abc'],
            operation: 'add',
            property: 'tags',
            value: [tag2.shortId]
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body.status
      await tap.equal(result.length, 2)
      await tap.equal(result[0].status, 204)
      await tap.equal(result[0].id, source2.shortId)
      await tap.equal(result[0].value, tag2.shortId)

      await tap.equal(result[1].status, 404)
      await tap.equal(result[1].id, source1.shortId + 'abc')
      await tap.equal(
        result[1].message,
        `No Source found with id ${source1.shortId}abc`
      )
    }
  )

  // ********************************************** REMOVE TAGS *******************************
  /*
before:
source1: tag1, tag2, tag3, tag4, tag5
source2: tag1, tag2, tag5
source3: tag2, tag3, tag4, tag5
*/

  await tap.test('Batch Update Sources - remove tags', async () => {
    const res = await request(app)
      .patch(`/sources/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          sources: [source1.shortId, source3.shortId],
          operation: 'remove',
          property: 'tags',
          value: [tag2.shortId]
        })
      )

    await tap.equal(res.status, 204)

    const getSource1 = await request(app)
      .get(`/sources/${source1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source1Tags = getSource1.body.tags
    await tap.equal(source1Tags.length, 4)
    await tap.ok(_.find(source1Tags, { name: 'tag1' }))
    await tap.notOk(_.find(source1Tags, { name: 'tag2' }))
    await tap.ok(_.find(source1Tags, { name: 'tag3' }))
    await tap.ok(_.find(source1Tags, { name: 'tag4' }))
    await tap.ok(_.find(source1Tags, { name: 'tag5' }))

    const getSource3 = await request(app)
      .get(`/sources/${source3.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source3Tags = getSource3.body.tags
    await tap.equal(source3Tags.length, 3)
    await tap.notOk(_.find(source3Tags, { name: 'tag2' }))
    await tap.ok(_.find(source3Tags, { name: 'tag3' }))
    await tap.ok(_.find(source3Tags, { name: 'tag4' }))
    await tap.ok(_.find(source3Tags, { name: 'tag5' }))
  })

  /*
before:
source1: tag1, tag3, tag4, tag5
source2: tag1, tag2, tag5
source3: tag3, tag4, tag5
*/

  await tap.test(
    'Batch Update Sources - remove tag that was not assigned to one of the sources',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source2.shortId, source3.shortId],
            operation: 'remove',
            property: 'tags',
            value: [tag1.shortId]
          })
        )

      await tap.equal(res.status, 204)

      const getSource2 = await request(app)
        .get(`/sources/${source2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source2Tags = getSource2.body.tags
      await tap.equal(source2Tags.length, 2)
      await tap.ok(_.find(source2Tags, { name: 'tag5' }))
      await tap.ok(_.find(source2Tags, { name: 'tag2' }))

      const getSource3 = await request(app)
        .get(`/sources/${source3.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const source3Tags = getSource3.body.tags
      await tap.equal(source3Tags.length, 3)
      await tap.ok(_.find(source3Tags, { name: 'tag3' }))
      await tap.ok(_.find(source3Tags, { name: 'tag4' }))
      await tap.ok(_.find(source3Tags, { name: 'tag5' }))
    }
  )

  /*
before:
source1: tag1, tag3, tag4, tag5
source2: tag2, tag5
source3: tag3, tag4, tag5
*/

  await tap.test('Batch Update Sources - remove multiple tags', async () => {
    const res = await request(app)
      .patch(`/sources/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          sources: [source1.shortId, source3.shortId],
          operation: 'remove',
          property: 'tags',
          value: [tag3.shortId, tag5.shortId]
        })
      )

    await tap.equal(res.status, 204)

    const getSource1 = await request(app)
      .get(`/sources/${source1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source1Tags = getSource1.body.tags
    await tap.equal(source1Tags.length, 2)
    await tap.ok(_.find(source1Tags, { name: 'tag1' }))
    await tap.ok(_.find(source1Tags, { name: 'tag4' }))

    const getSource3 = await request(app)
      .get(`/sources/${source3.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const source3Tags = getSource3.body.tags
    await tap.equal(source3Tags.length, 1)
    await tap.ok(_.find(source3Tags, { name: 'tag4' }))
  })

  /*
before:
source1: tag1, tag4
source2: tag2, tag5
source3: tag4
*/

  await tap.test(
    'Batch Update Sources - try to remove a tag from a source that does not exist',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source2.shortId + 'abc'],
            operation: 'remove',
            property: 'tags',
            value: [tag5.shortId]
          })
        )

      await tap.equal(res.status, 207)
      const result = res.body.status
      await tap.equal(result.length, 1)
      await tap.equal(result[0].status, 404)
      await tap.equal(result[0].id, source2.shortId + 'abc')
      await tap.equal(
        result[0].message,
        `No Source found with id ${source2.shortId}abc`
      )
    }
  )

  /*
before:
source1: tag1, tag4
source2: tag2, tag5
source3: tag4
*/

  await tap.test(
    'Batch Update Sources - try to remove a tag that does not exist from sources',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            sources: [source2.shortId, source3.shortId],
            operation: 'remove',
            property: 'tags',
            value: [tag5.shortId + 'abc']
          })
        )

      await tap.equal(res.status, 204)
    }
  )

  // *********************************************** GENERAL ERRORS ***********************************

  await tap.test('Try to batch update with empty body', async () => {
    const res = await request(app)
      .patch(`/sources/batchUpdate`)
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
      'Batch Update Source Request Error: Body must be a JSON object'
    )
    await tap.equal(error.details.requestUrl, `/sources/batchUpdate`)
    await tap.type(error.details.requestBody, 'object')
  })

  await tap.test(
    'Try to batch update with body missing properties',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
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
        'Batch Update Source Request Error: Body missing properties: value,operation,sources '
      )
      await tap.equal(error.details.requestUrl, `/sources/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
    }
  )

  await tap.test('Try to batch update with invalid operation', async () => {
    const res = await request(app)
      .patch(`/sources/batchUpdate`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          property: 'keywords',
          operation: 'something',
          value: '123',
          sources: [source1.shortId]
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      `Batch Update Source Request Error: something is not a valid operation. Must be 'replace', 'add' or 'remove' `
    )
    await tap.equal(error.details.requestUrl, `/sources/batchUpdate`)
    await tap.type(error.details.requestBody, 'object')
  })

  await tap.test(
    'Try to batch update a property that cannot be updated in batch',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            property: 'isbn',
            operation: 'replace',
            value: '123',
            sources: [source1.shortId]
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.message, 'Cannot replace property isbn')
      await tap.equal(error.details.requestUrl, `/sources/batchUpdate`)
      await tap.type(error.details.requestBody, 'object')
    }
  )

  await destroyDB(app)
}

module.exports = test
