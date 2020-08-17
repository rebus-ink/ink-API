const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Source } = require('../../models/Source')
const { Source_Tag } = require('../../models/Source_Tag')
const { urlToId } = require('../../utils/utils')
const { Attribution } = require('../../models/Attribution')
const { Tag } = require('../../models/Tag')
const { Note } = require('../../models/Note')
const crypto = require('crypto')
const _ = require('lodash')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const source1 = await Source.createSource(createdReader, {
    name: 'title of source',
    type: 'Book'
  })
  const source2 = await Source.createSource(createdReader, {
    name: 'title of source2',
    type: 'Book'
  })

  const tag1 = await Tag.createTag(urlToId(createdReader.id), {
    type: 'stack',
    name: 'mystack'
  })
  const tag2 = await Tag.createTag(urlToId(createdReader.id), {
    type: 'stack',
    name: 'mystack2'
  })
  const tag3 = await Tag.createTag(urlToId(createdReader.id), {
    type: 'stack',
    name: 'mystack3'
  })

  await tap.test('add Tag to Source', async () => {
    const res = await Source_Tag.addTagToSource(urlToId(source1.id), tag1.id)
    await tap.ok(res.sourceId)
    await tap.ok(res.tagId)
    await tap.equal(res.sourceId, source1.id)
    await tap.equal(urlToId(res.tagId), tag1.id)
  })

  await tap.test('addTagToSource with invalid tag id ', async () => {
    let error
    try {
      await Source_Tag.addTagToSource(urlToId(source1.id), tag1.id + '123')
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(error.message, 'no tag')
  })

  await tap.test('addTagToSource with invalid source id ', async () => {
    let error
    try {
      await Source_Tag.addTagToSource(undefined, tag1.id)
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(error.message, 'no source')
  })

  await tap.test('Source remove tag', async () => {
    const res = await Source_Tag.removeTagFromSource(
      urlToId(source1.id),
      tag1.id
    )
    await tap.equal(res, 1)
  })

  await tap.test('removeTagFromSource with invalid tag id ', async () => {
    let error
    try {
      await Source_Tag.removeTagFromSource(urlToId(source1.id), tag1.id + '123')
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.ok(
      error.message.startsWith(
        'Remove Tag from Source Error: No Relation found'
      )
    )
  })

  await tap.test('removeTagFromSource with invalid source id ', async () => {
    let error
    try {
      await Source_Tag.removeTagFromSource('123', tag1.id)
    } catch (err) {
      error = err
    }

    await tap.ok(error)
    await tap.ok(
      error.message.startsWith(
        'Remove Tag from Source Error: No Relation found'
      )
    )
  })

  // await tap.test('Try to assign same tag twice', async () => {
  //   await Source_Tag.addTagToSource(source1.id, tag1.id)

  //   const res = await Source_Tag.addTagToSource(
  //     source1.id,
  //     tag1.id
  //   )

  //   await tap.equal(res.message, 'duplicate')
  // })

  await tap.test('Delete Source_Tags when a Source is deleted', async () => {
    await Source_Tag.addTagToSource(urlToId(source1.id), tag1.id)
    await Source_Tag.addTagToSource(urlToId(source1.id), tag2.id)

    // Get the Source with 2 new tags
    const fetchedSource = await Source.byId(urlToId(source1.id))

    await tap.equal(fetchedSource.tags.length, 2)

    // Delete the entries in Source_Tag
    const numDeleted = await Source_Tag.deleteSourceTagsOfSource(
      urlToId(source1.id)
    )
    await tap.equal(numDeleted, 2)

    // Get the updated Source
    const newSource = await Source.byId(urlToId(source1.id))

    await tap.equal(newSource.tags.length, 0)
  })

  await tap.test(
    'Delete Source_Tags of a Source with an id that does not exist',
    async () => {
      const response = await Source_Tag.deleteSourceTagsOfSource(
        'invalidIdOfSource'
      )

      await tap.equal(response, 0)
    }
  )

  await tap.test('Delete Source_Tags of a Source with a null id', async () => {
    const response = await Source_Tag.deleteSourceTagsOfSource(null)

    await tap.ok(typeof response, Error)
    await tap.equal(response.message, 'no source')
  })

  await tap.test('Replace Tags for a Source', async () => {
    await Source_Tag.replaceTagsForSource(urlToId(source1.id), [
      tag2.id,
      tag3.id
    ])

    const queryResult = await Source_Tag.query().where(
      'sourceId',
      '=',
      urlToId(source1.id)
    )
    await tap.equal(queryResult.length, 2)
    await tap.ok(_.find(queryResult, { tagId: tag2.id }))
    await tap.ok(_.find(queryResult, { tagId: tag3.id }))
  })

  await destroyDB(app)
}

module.exports = test
