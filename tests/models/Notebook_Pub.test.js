const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Source } = require('../../models/Source')
const crypto = require('crypto')
const { urlToId } = require('../../utils/utils')
const { Notebook } = require('../../models/Notebook')
const { Notebook_Source } = require('../../models/Notebook_Source')

const test = async app => {
  const random = crypto.randomBytes(13).toString('hex')

  const reader = {
    name: 'J. Random Reader'
  }
  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const sourceObject = {
    name: 'source1',
    type: 'Book'
  }

  const source = await Source.createSource(createdReader, sourceObject)
  const sourceId = urlToId(source.id)

  let simpleNotebook = {
    name: 'notebook1',
    status: 'active'
  }

  const notebook = await Notebook.createNotebook(
    simpleNotebook,
    createdReader.id
  )
  const notebookId = urlToId(notebook.id)

  await tap.test('Add Source to Notebook', async () => {
    let error
    try {
      await Notebook_Source.addSourceToNotebook(notebookId, sourceId)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Try to Add invalid source to Notebook', async () => {
    let error
    try {
      await Notebook_Source.addSourceToNotebook(notebookId, sourceId + 'abc')
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(error.message, 'no source')
  })

  await tap.test('Try to add a Source to an invalid Notebook', async () => {
    let error
    try {
      await Notebook_Source.addSourceToNotebook(notebookId + 'abc', sourceId)
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(error.message, 'no notebook')
  })

  await tap.test(
    'Try to a Source to a Notebook when the relation already exists',
    async () => {
      let error
      try {
        await Notebook_Source.addSourceToNotebook(notebookId, sourceId)
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.equal(
        error.message,
        `Add Source to Notebook Error: Relationship already exists between Notebook ${notebookId} and Source ${sourceId}`
      )
    }
  )

  await tap.test('Remove Source from Notebook', async () => {
    let error
    try {
      await Notebook_Source.removeSourceFromNotebook(notebookId, sourceId)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test(
    'Try to Remove Source from Notebook when relation does not exist',
    async () => {
      let error
      try {
        await Notebook_Source.removeSourceFromNotebook(notebookId, sourceId)
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.equal(
        error.message,
        `Remove Source from Notebook Error: No Relation found between Notebook ${notebookId} and Source ${sourceId}`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
