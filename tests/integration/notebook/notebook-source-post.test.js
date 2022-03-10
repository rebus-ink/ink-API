const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook,
  createTag
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  const notebook = await createNotebook(app, token)
  const notebookId = notebook.shortId

  await tap.test('Create Source in Notebook', async () => {
    const res = await request(app)
      .post(`/notebooks/${notebookId}/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'source1',
          type: 'Book',
          json: { property1: 'value1' }
        })
      )
    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.json.property1, 'value1')
    await tap.equal(body.name, 'source1')
    await tap.equal(body.type, 'Book')
    await tap.ok(body.published)

    await tap.type(res.get('Location'), 'string')
    await tap.equal(res.get('Location') + '/', body.id)

    // source should show up in notebook
    const resNotebook = await request(app)
      .get(`/notebooks/${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(resNotebook.body.sources.length, 1)
  })

  const tag1 = await createTag(app, token, { type: 'test', name: 'tagA' })
  const tag2 = await createTag(app, token, { type: 'test', name: 'tagB' })

  await tap.test('Create a source with existing tags', async () => {
    const res = await request(app)
      .post(`/notebooks/${notebookId}/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source Keyword',
          type: 'Book',
          tags: [tag1, tag2]
        })
      )

    await tap.equal(res.status, 201)
    await tap.ok(res.body)
    await tap.ok(res.body.shortId)

    const resSource = await request(app)
      .get(`/sources/${res.body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = resSource.body
    await tap.ok(body.tags)
    await tap.equal(body.tags.length, 2)
  })

  await tap.test('Create a source with existing and new tags', async () => {
    const res = await request(app)
      .post(`/notebooks/${notebookId}/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source Keyword',
          type: 'Book',
          tags: [tag1, { name: 'tag3', type: 'stack' }]
        })
      )

    await tap.equal(res.status, 201)
    await tap.ok(res.body)
    await tap.ok(res.body.shortId)

    const resSource = await request(app)
      .get(`/sources/${res.body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = resSource.body
    await tap.ok(body.tags)
    await tap.equal(body.tags.length, 2)
  })

  await tap.test(
    'Create a source with existing tags and tags with invalid ids',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebookId}/sources`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source Keyword',
            type: 'Book',
            tags: [tag1, { id: tag2.id + 'abc', name: 'tag3', type: 'stack' }]
          })
        )

      await tap.equal(res.status, 201)
      await tap.ok(res.body)
      await tap.ok(res.body.shortId)

      const resSource = await request(app)
        .get(`/sources/${res.body.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const body = resSource.body
      await tap.ok(body.tags)
      await tap.equal(body.tags.length, 1)
    }
  )

  await tap.test('Create a source with existing and invalid tags', async () => {
    const res = await request(app)
      .post(`/notebooks/${notebookId}/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source Keyword',
          type: 'Book',
          tags: [tag1, { name: 'tagA', type: 'test' }]
        })
      )

    await tap.equal(res.status, 201)
    await tap.ok(res.body)
    await tap.ok(res.body.shortId)

    const resSource = await request(app)
      .get(`/sources/${res.body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = resSource.body
    await tap.ok(body.tags)
    await tap.equal(body.tags.length, 1)
  })

  await tap.test(
    'Try to create a Source in a Notebook without a type',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebookId}/sources`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'source1'
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        "Validation Error on Create Source: type: must have required property 'type'"
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}/sources`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'source1')
    }
  )

  await tap.test(
    'Try to create a Source in a Notebook with an invalid json',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebookId}/sources`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'source2',
            type: 'Book',
            json: 'a string!'
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Validation Error on Create Source: json: must be object,null'
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}/sources`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.json, 'a string!')
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.json[0].keyword, 'type')
      // await tap.equal(
      //   error.details.validation.json[0].params.type,
      //   ['object','null']
      // )
    }
  )

  await tap.test(
    'Try to create a Source for a Notebook that does not exist',
    async () => {
      const resSourcesBefore = await request(app)
        .get(`/library`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const numberOfSourcesBefore = resSourcesBefore.body.items.length

      const res = await request(app)
        .post(`/notebooks/${notebookId}abc/sources`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'source2',
            type: 'Book'
          })
        )

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Create Source Error: No Notebook found with id: ${notebookId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}abc/sources`
      )

      // source should source exist

      const resSourcesAfter = await request(app)
        .get(`/library`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resSourcesAfter.body.items.length, numberOfSourcesBefore)
    }
  )

  await destroyDB(app)
}

module.exports = test
