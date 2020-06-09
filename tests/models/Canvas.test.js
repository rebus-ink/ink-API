const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')
const { ValidationError } = require('objection')
const { Canvas } = require('../../models/Canvas')
const { Notebook } = require('../../models/Notebook')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')
  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)
  const readerId = urlToId(createdReader.id)
  let canvasId

  const notebook = await Notebook.createNotebook(
    { name: 'notebook1', type: 'outline' },
    readerId
  )

  await tap.test('Create Canvas should not throw an error', async () => {
    let error
    try {
      let canvas = await Canvas.createCanvas(
        {
          name: 'something',
          description: 'a description goes here',
          notebookId: notebook.id
        },
        readerId
      )
      canvasId = canvas.id
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Get Canvas by Id', async () => {
    let canvas = await Canvas.byId(canvasId)
    await tap.equal(canvas.name, 'something')
    await tap.equal(canvas.description, 'a description goes here')
    await tap.ok(canvas.readerId)
    await tap.ok(canvas.id)
    await tap.equal(canvas.notebookId, notebook.id)
  })

  await tap.test('Update a Canvas', async () => {
    let error
    try {
      await Canvas.update({
        id: canvasId,
        name: 'new name',
        readerId,
        notebookId: notebook.id
      })
    } catch (err) {
      console.log(err)
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Delete a Canvas', async () => {
    let error
    try {
      await Canvas.delete(canvasId)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Try to Create a Canvas without a notebookId', async () => {
    let error
    try {
      await Canvas.createCanvas(
        {
          name: 'something',
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

  await destroyDB(app)
}

module.exports = test
