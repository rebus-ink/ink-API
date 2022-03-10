const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')
const { ValidationError } = require('objection')
const { Collaborator } = require('../../models/Collaborator')
const { Notebook } = require('../../models/Notebook')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')
  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)
  const readerId = urlToId(createdReader.id)

  const notebook = await Notebook.createNotebook(
    { name: 'notebook1', type: 'outline' },
    readerId
  )
  const notebookId = urlToId(notebook.id)
  let collaboratorId

  await tap.test('Create Collaborator should work', async () => {
    let error
    try {
      let collaborator = await Collaborator.create(
        {
          readerId,
          status: 'pending',
          permission: { read: true, comment: true }
        },
        notebookId
      )
      collaboratorId = urlToId(collaborator.id)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)

    // check that Collaborator exists
    const storedCollab = await Collaborator.query().findById(collaboratorId)
    await tap.ok(storedCollab)
    await tap.equal(urlToId(storedCollab.readerId), readerId)
    await tap.equal(storedCollab.notebookId, notebookId)
    await tap.equal(storedCollab.status, 1)
    await tap.ok(storedCollab.permission)
    await tap.equal(storedCollab.permission.read, true)
    await tap.equal(storedCollab.permission.comment, true)
    await tap.ok(storedCollab.published)
    await tap.ok(storedCollab.updated)
    await tap.notOk(storedCollab.deleted)
  })

  await tap.test('Update a Collaborator', async () => {
    let error
    try {
      await Collaborator.update(
        {
          id: collaboratorId,
          name: 'new name',
          readerId,
          status: 'accepted',
          permission: { read: true, comment: false }
        },
        urlToId(notebookId)
      )
    } catch (err) {
      error = err
    }
    await tap.notOk(error)

    const storedCollab = await Collaborator.query().findById(collaboratorId)
    await tap.ok(storedCollab)
    await tap.equal(urlToId(storedCollab.readerId), readerId)
    await tap.equal(storedCollab.notebookId, notebookId)
    await tap.equal(storedCollab.status, 2)
    await tap.ok(storedCollab.permission)
    await tap.equal(storedCollab.permission.read, true)
    await tap.equal(storedCollab.permission.comment, false)
    await tap.ok(storedCollab.published)
    await tap.ok(storedCollab.updated)
    await tap.notEqual(storedCollab.published, storedCollab.updated)
    await tap.notOk(storedCollab.deleted)
  })

  await tap.test('Delete a Collaborator', async () => {
    let error
    try {
      await Collaborator.delete(collaboratorId)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
    const storedCollab = await Collaborator.query().findById(collaboratorId)
    await tap.ok(storedCollab.deleted)
  })

  await tap.test(
    'Try to Create a Collaborator without a notebookId',
    async () => {
      let error
      try {
        await Collaborator.create(
          {
            readerId,
            status: 'pending',
            permission: { read: true, comment: true }
          },
          null
        )
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.ok(error instanceof ValidationError)
    }
  )

  await tap.test(
    'Try to Create a Collaborator without a readerId',
    async () => {
      let error
      try {
        await Collaborator.create(
          {
            status: 'pending',
            permission: { read: true, comment: true }
          },
          notebookId
        )
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.ok(error instanceof ValidationError)
      await tap.equal(
        error.message,
        "readerId: must have required property 'readerId'"
      )
    }
  )

  await tap.test('Try to Create a Collaborator without a status', async () => {
    let error
    try {
      await Collaborator.create(
        {
          readerId,
          // status: 'pending',
          permission: { read: true, comment: true }
        },
        notebookId
      )
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(
      error.message,
      'Collaborator validation error: status is a required property'
    )
  })

  await tap.test(
    'Try to Create a Collaborator without a permission',
    async () => {
      let error
      try {
        await Collaborator.create(
          {
            readerId,
            status: 'pending'
            // permission: { read: true, comment: true }
          },
          notebookId
        )
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.ok(error instanceof ValidationError)
      await tap.equal(
        error.message,
        "permission: must have required property 'permission'"
      )
    }
  )

  await tap.test(
    'Try to Create a Collaborator with an invalid status',
    async () => {
      let error
      try {
        await Collaborator.create(
          {
            readerId,
            status: 'not a valid status',
            permission: { read: true, comment: true }
          },
          notebookId
        )
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.equal(
        error.message,
        'Collaborator validation error: not a valid status is not a valid status'
      )
    }
  )

  await tap.test(
    'Try to Create a Collaborator with an invalid readerId',
    async () => {
      let error
      try {
        await Collaborator.create(
          {
            readerId: readerId + 'abc',
            status: 'pending',
            permission: { read: true, comment: true }
          },
          notebookId
        )
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.equal(
        error.message,
        `Collaborator creation error: No Reader found with id ${readerId}abc`
      )
    }
  )

  await tap.test(
    'Try to Create a Collaborator with an invalid notebookId',
    async () => {
      let error
      try {
        await Collaborator.create(
          {
            readerId,
            status: 'pending',
            permission: { read: true, comment: true }
          },
          notebookId + 'abc'
        )
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.equal(
        error.message,
        `Collaborator creation error: No Notebook found with id ${notebookId}abc`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
