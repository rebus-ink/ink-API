const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')
const { ValidationError } = require('objection')
const { Notebook } = require('../../models/Notebook')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')
  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)
  const readerId = urlToId(createdReader.id)
  let notebookId, notebook1

  await tap.test('Create Notebook', async () => {
    let error
    try {
      let notebook = await Notebook.createNotebook(
        {
          status: 'active',
          name: 'notebook1',
          description: 'a description goes here',
          settings: { property: 'value' }
        },
        readerId
      )
      notebookId = urlToId(notebook.id)
      notebook1 = notebook
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Create Notebook with only name and status', async () => {
    let error
    try {
      await Notebook.createNotebook(
        {
          status: 'archived',
          name: 'something'
        },
        readerId
      )
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Get Notebook by id', async () => {
    let notebook = await Notebook.byId(notebookId)

    await tap.ok(notebook)
    await tap.ok(notebook.id)
    await tap.equal(notebook.name, 'notebook1')
    await tap.equal(notebook.description, 'a description goes here')
    await tap.equal(notebook.status, 1)
  })

  await tap.test('Try to get notebook that does note exist', async () => {
    let notebook = await Notebook.byId(notebookId + 'abc')

    await tap.notOk(notebook)
  })

  await tap.test('Update a Notebook', async () => {
    let error
    try {
      await Notebook.update(
        Object.assign(notebook1, {
          id: notebookId,
          status: 'active',
          description: 'new',
          name: 'new name'
        })
      )
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Try to Create Notebook without a name', async () => {
    let error
    try {
      await Notebook.createNotebook(
        {
          status: 'active',
          description: 'a description goes here'
        },
        readerId
      )
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.ok(error instanceof ValidationError)
  })

  await tap.test('Get notebooks for a reader', async () => {
    let notebooks = await Notebook.byReader(urlToId(createdReader.id))

    await tap.equal(notebooks.length, 2)
    await tap.ok(notebooks[0].tags)
  })

  await destroyDB(app)
}

module.exports = test
