const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Publication } = require('../../models/Publication')
const crypto = require('crypto')
const { urlToId } = require('../../utils/utils')
const { Notebook } = require('../../models/Notebook')
const { Notebook_Pub } = require('../../models/Notebook_Pub')

const test = async app => {
  const random = crypto.randomBytes(13).toString('hex')

  const reader = {
    name: 'J. Random Reader'
  }
  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const publicationObject = {
    name: 'pub1',
    type: 'Book'
  }

  const pub = await Publication.createPublication(
    createdReader,
    publicationObject
  )
  const pubId = urlToId(pub.id)

  let simpleNotebook = {
    name: 'notebook1',
    status: 'active'
  }

  const notebook = await Notebook.createNotebook(
    simpleNotebook,
    createdReader.id
  )
  const notebookId = urlToId(notebook.id)

  await tap.test('Add Pub to Notebook', async () => {
    let error
    try {
      await Notebook_Pub.addPubToNotebook(notebookId, pubId)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Try to Add invalid pub to Notebook', async () => {
    let error
    try {
      await Notebook_Pub.addPubToNotebook(notebookId, pubId + 'abc')
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(error.message, 'no publication')
  })

  await tap.test('Try to add a Pub to an invalid Notebook', async () => {
    let error
    try {
      await Notebook_Pub.addPubToNotebook(notebookId + 'abc', pubId)
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(error.message, 'no notebook')
  })

  await tap.test(
    'Try to a Pub to a Notebook when the relation already exists',
    async () => {
      let error
      try {
        await Notebook_Pub.addPubToNotebook(notebookId, pubId)
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.equal(
        error.message,
        `Add Publication to Notebook Error: Relationship already exists between Notebook ${notebookId} and Publication ${pubId}`
      )
    }
  )

  await tap.test('Remove Pub from Notebook', async () => {
    let error
    try {
      await Notebook_Pub.removePubFromNotebook(notebookId, pubId)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test(
    'Try to Remove Pub from Notebook when relation does not exist',
    async () => {
      let error
      try {
        await Notebook_Pub.removePubFromNotebook(notebookId, pubId)
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.equal(
        error.message,
        `Remove Publication from Notebook Error: No Relation found between Notebook ${notebookId} and Publication ${pubId}`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
