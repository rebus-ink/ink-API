const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')
const { NoteRelationContext } = require('../../models/NoteRelationContext')
const { ValidationError } = require('objection')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')
  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)
  const readerId = urlToId(createdReader.id)

  await tap.test(
    'Create NoteRelationContext shouldn not throw an error',
    async () => {
      let error
      try {
        await NoteRelationContext.createNoteRelationContext(
          {
            type: 'test',
            name: 'something',
            description: 'a description goes here'
          },
          readerId
        )
      } catch (err) {
        error = err
      }
      await tap.notOk(error)
    }
  )

  await tap.test('Create NoteRelationContext with only a type', async () => {
    let error
    try {
      await NoteRelationContext.createNoteRelationContext(
        {
          type: 'test'
        },
        readerId
      )
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test(
    'Try to Create NoteRelationContext without a type',
    async () => {
      let error
      try {
        await NoteRelationContext.createNoteRelationContext(
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
    }
  )

  await destroyDB(app)
}

module.exports = test
