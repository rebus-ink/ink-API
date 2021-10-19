const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource
} = require('../../utils/testUtils')
const _ = require('lodash')
const app = require('../../../server').app

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  const source0 = await createSource(app, token)
  const source1 = await createSource(app, token, {
    name: 'title contains TarGet and stuff',
    type: 'Drawing'
  })
  const source2 = await createSource(app, token, {
    name: 'boring name',
    description: 'description contains target and stuff'
  })
  const source3 = await createSource(app, token, {
    name: 'another boring name',
    abstract: 'abstract contains target and stuff'
  })
  const source4 = await createSource(app, token, {
    name: 'yet another boring name',
    keywords: ['target', 'other']
  })
  const source5 = await createSource(app, token, {
    name: 'boring source',
    author: 'Dr. Target et al.'
  })

  const isIncluded = function (collection, source) {
    return _.findIndex(collection, item => item.shortId === source.shortId) > -1
  }

  await tap.test('Search sources, omit name', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: false,
          includeSources: true,
          sources: {
            name: false
          },
          includeNotebooks: false
        })
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.sources)
    await tap.type(body.sources.totalItems, 'number')
    await tap.equal(body.sources.totalItems, 4)
    await tap.ok(Array.isArray(body.sources.items))
    await tap.equal(body.sources.items.length, 4)
    await tap.equal(isIncluded(body.sources.items, source0), false)
    await tap.equal(isIncluded(body.sources.items, source1), false)
    await tap.equal(isIncluded(body.sources.items, source2), true)
    await tap.equal(isIncluded(body.sources.items, source3), true)
    await tap.equal(isIncluded(body.sources.items, source4), true)
    await tap.equal(isIncluded(body.sources.items, source5), true)
  })

  await tap.test('Search sources, filter by type', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: false,
          includeSources: true,
          sources: {
            type: 'Drawing'
          },
          includeNotebooks: false
        })
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.sources)
    await tap.type(body.sources.totalItems, 'number')
    await tap.equal(body.sources.totalItems, 1)
    console.log(body.sources.items)
    await tap.ok(Array.isArray(body.sources.items))
    await tap.equal(body.sources.items.length, 1)
    await tap.equal(isIncluded(body.sources.items, source0), false)
    await tap.equal(isIncluded(body.sources.items, source1), true)
    await tap.equal(isIncluded(body.sources.items, source2), false)
    await tap.equal(isIncluded(body.sources.items, source3), false)
    await tap.equal(isIncluded(body.sources.items, source4), false)
    await tap.equal(isIncluded(body.sources.items, source5), false)
  })

  await tap.test('Search sources, omit description and abstract', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: false,
          includeSources: true,
          sources: {
            description: false,
            abstract: false
          },
          includeNotebooks: false
        })
      )

    await tap.equal(res.status, 200)

    const body = res.body
    await tap.ok(body.sources)
    await tap.type(body.sources.totalItems, 'number')
    await tap.equal(body.sources.totalItems, 3)
    await tap.ok(Array.isArray(body.sources.items))
    await tap.equal(body.sources.items.length, 3)
    await tap.equal(isIncluded(body.sources.items, source0), false)
    await tap.equal(isIncluded(body.sources.items, source1), true)
    await tap.equal(isIncluded(body.sources.items, source2), false)
    await tap.equal(isIncluded(body.sources.items, source3), false)
    await tap.equal(isIncluded(body.sources.items, source4), true)
    await tap.equal(isIncluded(body.sources.items, source5), true)
  })

  // Pagination
  const source6 = await createSource(app, token, {
    name: 'title contains TarGet and stuff'
  })
  const source7 = await createSource(app, token, { name: 'target111' })
  const source8 = await createSource(app, token, { name: 'target2' })
  const source9 = await createSource(app, token, { name: 'target3' })
  const source10 = await createSource(app, token, { name: 'target4' })
  const source11 = await createSource(app, token, { name: 'target5' })
  const source12 = await createSource(app, token, { name: 'target6' })

  await tap.test('Search sources with pagination', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: false,
          includeSources: true,
          sources: {
            description: false,
            limit: 10
          },
          includeNotebooks: false
        })
      )

    await tap.equal(res.status, 200)

    const body = res.body
    await tap.ok(body.sources)
    await tap.type(body.sources.totalItems, 'number')
    await tap.equal(body.sources.totalItems, 11)
    await tap.ok(Array.isArray(body.sources.items))
    await tap.equal(body.sources.items.length, 10)
  })

  await tap.test('Search sources with pagination, page 2', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: false,
          includeSources: true,
          sources: {
            limit: 10,
            page: 2
          },
          includeNotebooks: false
        })
      )

    await tap.equal(res.status, 200)

    const body = res.body
    await tap.ok(body.sources)
    await tap.type(body.sources.totalItems, 'number')
    await tap.equal(body.sources.totalItems, 12)
    await tap.ok(Array.isArray(body.sources.items))
    await tap.equal(body.sources.items.length, 2)
  })

  await destroyDB(app)
}

module.exports = test
