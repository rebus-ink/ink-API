'use strict'
let config
/* istanbul ignore next */
if (process.env.POSTGRE_INSTANCE) {
  config = require('../knexfile.js')['postgresql']
} else {
  config = require('../knexfile.js')['development']
}
const knex = require('knex')(config)
const objection = require('objection')
const Model = objection.Model
Model.knex(knex)
const { Reader } = require('../models/Reader')
const { Publication } = require('../models/Publication')
const { Document } = require('../models/Document')
const { Note } = require('../models/Note')
const { Activity } = require('../models/Activity')
const { Attribution } = require('../models/Attribution')
const tap = require('tap')

tap.test('Models', async test => {
  await knex.migrate.latest()

  test.test('Reader jsonSchema', test => {
    test.ok(Reader.jsonSchema)
    test.ok(Reader.relationMappings)
    test.end()
  })

  test.test('Reader model', async test => {
    let result
    await objection
      .transaction(Reader.knex(), async trx => {
        result = await Reader.query()
          .transacting(trx)
          .insertAndFetch({ userId: 'auth0|fakeid' })
        return trx.rollback()
      })
      .catch(() => {})
    const reader = JSON.parse(JSON.stringify(result))
    test.ok(reader.published)
    test.ok(reader.updated)
    test.ok(reader.id.includes('reader-'))
    test.end()
  })

  test.test('Reader model - update', async test => {
    let updated
    await objection
      .transaction(Reader.knex(), async trx => {
        const result = await Reader.query()
          .transacting(trx)
          .insertAndFetch({ userId: 'auth0|fakeid' })
        result.json = { summary: 'Anonymous' }
        updated = await Reader.query()
          .transacting(trx)
          .updateAndFetchById(result.id, result)
        return trx.rollback()
      })
      .catch(() => {})
    test.equals(updated.json.summary, 'Anonymous')
    test.end()
  })
  test.test('Publication Model - static properties', test => {
    test.ok(Publication.jsonSchema)
    test.ok(Publication.tableName)
    test.ok(Publication.relationMappings)
    test.end()
  })
  test.test('Document Model - static properties', test => {
    test.ok(Document.jsonSchema)
    test.ok(Document.tableName)
    test.ok(Document.relationMappings)
    test.end()
  })
  test.test('Note Model - static properties', test => {
    test.ok(Note.jsonSchema)
    test.ok(Note.tableName)
    test.ok(Note.relationMappings)
    test.end()
  })
  test.test('Activity Model - static properties', test => {
    test.ok(Activity.jsonSchema)
    test.ok(Activity.tableName)
    test.ok(Activity.relationMappings)
    test.end()
  })
  test.test('Attribution Model - static properties', test => {
    test.ok(Attribution.jsonSchema)
    test.ok(Attribution.tableName)
    test.ok(Attribution.relationMappings)
    test.end()
  })
})

tap.tearDown(async function () {
  await knex.migrate.rollback()
  return knex.destroy()
})
