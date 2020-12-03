const request = require('supertest')
const tap = require('tap')
const { getToken, createUser, destroyDB } = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')
const { Source } = require('../../../models/Source')
const { Attribution } = require('../../../models/Attribution')
const { ReadActivity } = require('../../../models/ReadActivity')
const { Source_Tag } = require('../../../models/Source_Tag')
const { Tag } = require('../../../models/Tag')
const _ = require('lodash')

const test = async () => {
  const token = getToken()
  const reader = await createUser(app, token)
  const readerId = urlToId(reader)

  // 25 hours ago
  const timestamp25 = new Date(Date.now() - 90000 * 1000).toISOString()
  // now
  const timestampNow = new Date(Date.now()).toISOString()

  // create sources
  const source1 = await Source.query().insertAndFetch({
    name: 'source1',
    type: 'Article',
    readerId: readerId,
    deleted: timestamp25,
    json: { storageId: 'file123' }
  })
  const source2 = await Source.query().insertAndFetch({
    name: 'source2',
    type: 'Article',
    readerId: readerId,
    deleted: timestamp25,
    json: { storageId: '456' }
  })

  // not deleted
  const source3 = await Source.query().insertAndFetch({
    name: 'source3',
    type: 'Article',
    readerId: readerId
  })

  // deleted recently
  const source4 = await Source.query().insertAndFetch({
    name: 'source4',
    type: 'Article',
    readerId: readerId,
    deleted: timestampNow
  })

  // source-tag relation
  const tag = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'test tag',
    readerId
  })
  await Source_Tag.query().insert({
    sourceId: source1.id,
    tagId: tag.id
  })
  await Source_Tag.query().insert({
    sourceId: source4.id,
    tagId: tag.id
  })

  // create attributions
  // deleted directly
  await Attribution.query().insertAndFetch({
    role: 'author',
    name: 'author1',
    normalizedName: 'johnsmith',
    readerId: readerId,
    sourceId: source3.id,
    deleted: timestamp25
  })

  // not directly deleted, but associated with a deleted source
  await Attribution.query().insertAndFetch({
    role: 'author',
    name: 'author2',
    normalizedName: 'johnsmith2',
    readerId: readerId,
    sourceId: source2.id
  })

  // not deleted
  await Attribution.query().insertAndFetch({
    role: 'author',
    name: 'author3',
    normalizedName: 'johnsmith2',
    readerId: readerId,
    sourceId: source3.id
  })

  // deleted recently
  await Attribution.query().insertAndFetch({
    role: 'author',
    name: 'author4',
    normalizedName: 'johnsmith2',
    readerId: readerId,
    sourceId: source4.id,
    deleted: timestampNow
  })

  // readActivities -- NOTE: do not have a 'deleted' field, but should be deleted when the source is
  await ReadActivity.query().insertAndFetch({
    selector: { property: 'value' },
    readerId: readerId,
    sourceId: source1.id
  })

  await ReadActivity.query().insertAndFetch({
    selector: { property: 'value' },
    readerId: readerId,
    sourceId: source2.id
  })

  // not deleted
  await ReadActivity.query().insertAndFetch({
    selector: { property: 'value' },
    readerId: readerId,
    sourceId: source3.id
  })

  // deleted recently
  await ReadActivity.query().insertAndFetch({
    selector: { property: 'value' },
    readerId: readerId,
    sourceId: source4.id
  })

  await tap.test('Before hard delete', async () => {
    const sources = await Source.query()
    await tap.equal(sources.length, 4)

    const attributions = await Attribution.query()
    await tap.equal(attributions.length, 4)

    const readActivities = await ReadActivity.query()
    await tap.equal(readActivities.length, 4)

    const source_tags = await Source_Tag.query()
    await tap.equal(source_tags.length, 2)
  })

  await tap.test('Hard Delete', async () => {
    const res = await request(app)
      .delete('/hardDelete')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 204)

    const sources = await Source.query()
    await tap.equal(sources.length, 2)
    await tap.notOk(_.find(sources, { name: 'source1' }))
    await tap.notOk(_.find(sources, { name: 'source2' }))
    await tap.ok(_.find(sources, { name: 'source3' }))
    await tap.ok(_.find(sources, { name: 'source4' }))

    const attributions = await Attribution.query()
    await tap.equal(attributions.length, 2)
    await tap.notOk(_.find(attributions, { name: 'author1' }))
    await tap.notOk(_.find(attributions, { name: 'author2' }))
    await tap.ok(_.find(attributions, { name: 'author3' }))
    await tap.ok(_.find(attributions, { name: 'author4' }))

    const readActivities = await ReadActivity.query()
    await tap.equal(readActivities.length, 2)
    await tap.notOk(_.find(readActivities, { sourceId: source1.id }))
    await tap.notOk(_.find(readActivities, { sourceId: source2.id }))
    await tap.ok(_.find(readActivities, { sourceId: source3.id }))
    await tap.ok(_.find(readActivities, { sourceId: source4.id }))

    const source_tags = await Source_Tag.query()
    await tap.equal(source_tags.length, 1)
    await tap.equal(source_tags[0].sourceId, source4.id)
  })

  const source5 = await Source.query().insertAndFetch({
    name: 'source5',
    type: 'Article',
    links: {
      data: [
        {
          url: 'http://example.org/abc',
          encodingFormat: 'text/html',
          name: 'An example link'
        }
      ]
    },
    readingOrder: {
      data: [
        {
          url: 'http://example.org/abc',
          encodingFormat: 'text/html',
          name: 'An example reading order object1'
        },
        {
          url: 'http://example.org/abc',
          encodingFormat: 'text/html',
          name: 'An example reading order object2'
        },
        {
          url: 'http://example.org/abc',
          encodingFormat: 'text/html',
          name: 'An example reading order object3'
        }
      ]
    },
    resources: {
      data: [
        {
          url: 'http://example.org/abc',
          encodingFormat: 'text/html',
          name: 'An example resource'
        }
      ]
    },
    readerId: readerId,
    referenced: timestamp25,
    datePublished: timestamp25,
    numberOfPages: 100,
    json: { property: 'value' },
    abstract: 'abstract',
    description: 'description',
    wordCount: 500,
    status: 1,
    encodingFormat: 'epub',
    metadata: {
      keywords: ['one'],
      url: 'www.url.com',
      dateModified: '123',
      bookFormat: 'format',
      copyrightYear: 1999,
      genre: 'horror',
      license: 'license',
      inLanguage: ['en'],
      bookEdition: '1',
      isbn: '1234',
      inDirection: 'ltr'
    }
  })

  const source6 = await Source.query().insertAndFetch({
    name: 'source6',
    type: 'Article',
    readerId: readerId,
    links: {
      data: [
        {
          url: 'http://example.org/abc',
          encodingFormat: 'text/html',
          name: 'An example link'
        }
      ]
    },
    readingOrder: {
      data: [
        {
          url: 'http://example.org/abc',
          encodingFormat: 'text/html',
          name: 'An example reading order object1'
        },
        {
          url: 'http://example.org/abc',
          encodingFormat: 'text/html',
          name: 'An example reading order object2'
        }
      ]
    },
    resources: {
      data: [
        {
          url: 'http://example.org/abc',
          encodingFormat: 'text/html',
          name: 'An example resource'
        }
      ]
    },
    referenced: timestampNow
  })

  await tap.test('Hard Delete', async () => {
    const res = await request(app)
      .delete('/hardDelete')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 204)

    const sources = await Source.query()
    await tap.equal(sources.length, 4)
    const source5Index = _.findIndex(sources, { name: 'source5' })
    await tap.ok(sources[source5Index])
    await tap.notOk(sources[source5Index].links)
    await tap.notOk(sources[source5Index].resources)
    await tap.notOk(sources[source5Index].readingOrder)
    await tap.notOk(sources[source5Index].abstract)
    await tap.notOk(sources[source5Index].description)
    await tap.notOk(sources[source5Index].metadata.keywords)
    await tap.notOk(sources[source5Index].metadata.url)
    await tap.notOk(sources[source5Index].metadata.dateModified)
    await tap.notOk(sources[source5Index].metadata.bookFormat)
    await tap.notOk(sources[source5Index].metadata.copyrightYear)
    await tap.notOk(sources[source5Index].metadata.genre)
    await tap.notOk(sources[source5Index].metadata.license)
    await tap.notOk(sources[source5Index].wordCount)
    await tap.notOk(sources[source5Index].status)
    await tap.notOk(sources[source5Index].encodingFormat)
    await tap.notOk(sources[source5Index].metadata.inDirection)
    await tap.ok(sources[source5Index].name)
    await tap.ok(sources[source5Index].type)
    await tap.ok(sources[source5Index].datePublished)
    await tap.ok(sources[source5Index].metadata.inLanguage)
    await tap.ok(sources[source5Index].metadata.bookEdition)
    await tap.ok(sources[source5Index].metadata.isbn)
    await tap.ok(sources[source5Index].numberOfPages)
    await tap.ok(sources[source5Index].json)

    const source6Index = _.findIndex(sources, { name: 'source6' })
    await tap.ok(sources[source6Index])
    await tap.ok(sources[source6Index].links)
    await tap.ok(sources[source6Index].resources)
    await tap.ok(sources[source6Index].readingOrder)
    await tap.ok(_.find(sources, { name: 'source6' }))
  })

  await destroyDB(app)
}

module.exports = test
