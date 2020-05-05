const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Tag } = require('../../models/Tag')
const crypto = require('crypto')
const { urlToId } = require('../../utils/utils')
const { Notebook } = require('../../models/Notebook')
const { Notebook_Tag } = require('../../models/Notebook_Tag')

const test = async app => {
  const random = crypto.randomBytes(13).toString('hex')

  const reader = {
    name: 'J. Random Reader'
  }
  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const tagObject = {
    type: 'stack',
    name: 'mystack',
    json: { property: 1 }
  }
  const tag = await Tag.createTag(createdReader.id, tagObject)

  let simpleNotebook = {
    name: 'notebook1',
    status: 99
  }

  const notebook = await Notebook.createNotebook(
    simpleNotebook,
    createdReader.id
  )

  await tap.test('Add Tag to Notebook', async () => {
    let error
    try {
      await Notebook_Tag.addTagToNotebook(urlToId(notebook.id), tag.id)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Try to Add invalid Tag to Notebook', async () => {
    let error
    try {
      await Notebook_Tag.addTagToNotebook(urlToId(notebook.id), tag.id + 'abc')
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(error.message, 'no tag')
  })

  await tap.test('Try to a Tag to an invalid Notebook', async () => {
    let error
    try {
      await Notebook_Tag.addTagToNotebook(urlToId(notebook.id) + 'abc', tag.id)
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(error.message, 'no notebook')
  })

  await tap.test(
    'Try to a Tag to a Notebook when the relation already exists',
    async () => {
      let error
      try {
        await Notebook_Tag.addTagToNotebook(urlToId(notebook.id), tag.id)
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.equal(
        error.message,
        `Add Tag to Notebook Error: Relationship already exists between Notebook ${urlToId(
          notebook.id
        )} and Tag ${tag.id}`
      )
    }
  )

  await tap.test('Remove Tag from Notebook', async () => {
    let error
    try {
      await Notebook_Tag.removeTagFromNotebook(urlToId(notebook.id), tag.id)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test(
    'Try to Remove Tag from Notebook when relation does not exist',
    async () => {
      let error
      try {
        await Notebook_Tag.removeTagFromNotebook(urlToId(notebook.id), tag.id)
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.equal(
        error.message,
        `Remove Tag from Notebook Error: No Relation found between Tag ${
          tag.id
        } and Notebook ${urlToId(notebook.id)}`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
