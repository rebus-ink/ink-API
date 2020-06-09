const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNotebook,
  addSourceToNotebook
} = require('../../utils/testUtils')
const app = require('../../../server').app

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  const createSourceSimplified = async object => {
    return await createSource(app, token, object)
  }

  const source1 = await createSourceSimplified({
    name: 'Source 1'
  })

  const source2 = await createSourceSimplified({
    name: 'Source 2'
  })

  await createSourceSimplified({ name: 'Source 3' })

  const notebook = await createNotebook(app, token, { name: 'notebook1' })
  const notebookId = notebook.shortId

  await tap.test('Filter Library by notebook with empty notebook', async () => {
    const res = await request(app)
      .get(`/library?notebook=${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 0)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 0)
  })

  await addSourceToNotebook(app, token, source1.shortId, notebookId)
  await addSourceToNotebook(app, token, source2.shortId, notebookId)

  await tap.test('Filter Library by notebook', async () => {
    const res = await request(app)
      .get(`/library?notebook=${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 2)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 2)
  })

  await tap.test('should work with pagination', async () => {
    const source4 = await createSourceSimplified({ name: 'Source 4 test' })
    const source5 = await createSourceSimplified({ name: 'Source 5' })
    const source6 = await createSourceSimplified({ name: 'Source 6' })
    await createSourceSimplified({ name: 'Source 7 test' })
    const source8 = await createSourceSimplified({ name: 'Source 8' })
    const source9 = await createSourceSimplified({ name: 'Source 9' })
    const source10 = await createSourceSimplified({
      name: 'Source 10'
    })
    const source11 = await createSourceSimplified({
      name: 'Source 11'
    })
    const source12 = await createSourceSimplified({ name: 'Source 12' })
    const source13 = await createSourceSimplified({
      name: 'Source 13'
    })

    await addSourceToNotebook(app, token, source4.shortId, notebookId)
    await addSourceToNotebook(app, token, source5.shortId, notebookId)
    await addSourceToNotebook(app, token, source6.shortId, notebookId)
    await addSourceToNotebook(app, token, source8.shortId, notebookId)
    await addSourceToNotebook(app, token, source9.shortId, notebookId)
    await addSourceToNotebook(app, token, source10.shortId, notebookId)
    await addSourceToNotebook(app, token, source11.shortId, notebookId)
    await addSourceToNotebook(app, token, source12.shortId, notebookId)
    await addSourceToNotebook(app, token, source13.shortId, notebookId)

    // get library with filter for notebook with pagination
    const res = await request(app)
      .get(`/library?notebook=${notebookId}&limit=10`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 11)
    await tap.equal(body.items.length, 10)
  })

  await tap.test('Filter Library with a non-existing notebook', async () => {
    const res = await request(app)
      .get(`/library?notebook=${notebookId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 0)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 0)
  })

  await destroyDB(app)
}

module.exports = test
