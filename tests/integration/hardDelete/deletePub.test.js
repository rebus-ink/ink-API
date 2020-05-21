const request = require('supertest')
const tap = require('tap')
const { getToken, createUser, destroyDB } = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')
const { Publication } = require('../../../models/Publication')
const { Attribution } = require('../../../models/Attribution')
const { ReadActivity } = require('../../../models/ReadActivity')
const { Publication_Tag } = require('../../../models/Publications_Tags')
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

  // create publications
  const pub1 = await Publication.query().insertAndFetch({
    name: 'pub1',
    type: 'Article',
    readerId: readerId,
    deleted: timestamp25
  })
  const pub2 = await Publication.query().insertAndFetch({
    name: 'pub2',
    type: 'Article',
    readerId: readerId,
    deleted: timestamp25
  })

  // not deleted
  const pub3 = await Publication.query().insertAndFetch({
    name: 'pub3',
    type: 'Article',
    readerId: readerId
  })

  // deleted recently
  const pub4 = await Publication.query().insertAndFetch({
    name: 'pub4',
    type: 'Article',
    readerId: readerId,
    deleted: timestampNow
  })

  // pub-tag relation
  const tag = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'test tag',
    readerId
  })
  await Publication_Tag.query().insert({
    publicationId: pub1.id,
    tagId: tag.id
  })
  await Publication_Tag.query().insert({
    publicationId: pub4.id,
    tagId: tag.id
  })

  // create attributions
  await Attribution.query().insertAndFetch({
    role: 'author',
    name: 'author1',
    normalizedName: 'johnsmith',
    readerId: readerId,
    publicationId: pub1.id,
    deleted: timestamp25
  })

  // not directly deleted, but associated with a deleted publication
  await Attribution.query().insertAndFetch({
    role: 'author',
    name: 'author2',
    normalizedName: 'johnsmith2',
    readerId: readerId,
    publicationId: pub2.id
  })

  // not deleted
  await Attribution.query().insertAndFetch({
    role: 'author',
    name: 'author3',
    normalizedName: 'johnsmith2',
    readerId: readerId,
    publicationId: pub3.id
  })

  // deleted recently
  await Attribution.query().insertAndFetch({
    role: 'author',
    name: 'author4',
    normalizedName: 'johnsmith2',
    readerId: readerId,
    publicationId: pub4.id,
    deleted: timestampNow
  })

  // readActivities -- NOTE: do not have a 'deleted' field, but should be deleted when the publication is
  await ReadActivity.query().insertAndFetch({
    selector: { property: 'value' },
    readerId: readerId,
    publicationId: pub1.id
  })

  await ReadActivity.query().insertAndFetch({
    selector: { property: 'value' },
    readerId: readerId,
    publicationId: pub2.id
  })

  // not deleted
  await ReadActivity.query().insertAndFetch({
    selector: { property: 'value' },
    readerId: readerId,
    publicationId: pub3.id
  })

  // deleted recently
  await ReadActivity.query().insertAndFetch({
    selector: { property: 'value' },
    readerId: readerId,
    publicationId: pub4.id
  })

  await tap.test('Before hard delete', async () => {
    const pubs = await Publication.query()
    await tap.equal(pubs.length, 4)

    const attributions = await Attribution.query()
    await tap.equal(attributions.length, 4)

    const readActivities = await ReadActivity.query()
    await tap.equal(readActivities.length, 4)

    const pub_tags = await Publication_Tag.query()
    await tap.equal(pub_tags.length, 2)
  })

  await tap.test('Hard Delete', async () => {
    const res = await request(app)
      .delete('/hardDelete')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 204)

    const pubs = await Publication.query()
    await tap.equal(pubs.length, 2)
    await tap.notOk(_.find(pubs, { name: 'pub1' }))
    await tap.notOk(_.find(pubs, { name: 'pub2' }))
    await tap.ok(_.find(pubs, { name: 'pub3' }))
    await tap.ok(_.find(pubs, { name: 'pub4' }))

    const attributions = await Attribution.query()
    await tap.equal(attributions.length, 2)
    await tap.notOk(_.find(attributions, { name: 'author1' }))
    await tap.notOk(_.find(attributions, { name: 'author2' }))
    await tap.ok(_.find(attributions, { name: 'author3' }))
    await tap.ok(_.find(attributions, { name: 'author4' }))

    const readActivities = await ReadActivity.query()
    await tap.equal(readActivities.length, 2)
    await tap.notOk(_.find(readActivities, { publicationId: pub1.id }))
    await tap.notOk(_.find(readActivities, { publicationId: pub2.id }))
    await tap.ok(_.find(readActivities, { publicationId: pub3.id }))
    await tap.ok(_.find(readActivities, { publicationId: pub4.id }))

    const pub_tags = await Publication_Tag.query()
    await tap.equal(pub_tags.length, 1)
    await tap.equal(pub_tags[0].publicationId, pub4.id)
  })

  await destroyDB(app)
}

module.exports = test
