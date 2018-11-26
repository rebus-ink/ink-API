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
const { Tag } = require('../models/Tag')
const tap = require('tap')

tap.test('Models', async test => {
  await knex.migrate.latest()

  test.test('Reader jsonSchema', test => {
    test.ok(Reader.jsonSchema)
    test.ok(Reader.relationMappings)
    test.end()
  })

  test.test('Reader model', async test => {
    let result, publication, docs, notes
    await objection
      .transaction(Reader.knex(), async trx => {
        result = await Reader.query()
          .transacting(trx)
          .insertAndFetch({ userId: 'auth0|fakeid' })
        publication = await Publication.query()
          .transacting(trx)
          .insertGraph({
            bto: result.url,
            name: 'Bingo! The Publication',
            replies: [{ type: 'Note', content: 'This should be HTML' }],
            attachment: [{ type: 'Document', name: 'Test Document' }]
          })
        docs = await Document.query().transacting(trx)
        notes = await Document.query().transacting(trx)
        return trx.rollback()
      })
      .catch(() => {})
    const reader = JSON.parse(JSON.stringify(result))
    test.ok(reader.published)
    test.ok(reader.updated)
    test.ok(reader.id.includes('reader-'))
    test.equals(publication.json.name, 'Bingo! The Publication')
    test.notOk(publication.json.bto)
    test.ok(publication.url.includes('publication-'))
    test.ok(docs[0])
    test.ok(docs[0].id)
    test.ok(docs[0].url.includes('document-'))
    test.ok(notes[0])
    test.ok(notes[0].id)
    test.ok(notes[0].url.includes('reader-'))
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
  test.test('Activity Model - static properties', async test => {
    test.equal(Activity.tableName, 'Activity')
    test.type(Activity.jsonSchema, 'object')
    test.type(Activity.jsonSchema.properties, 'object')
    test.type(Activity.jsonSchema.properties.type, 'object')
    test.type(Activity.jsonSchema.properties.readerId, 'object')
    test.type(Activity.jsonSchema.properties.publicationId, 'object')
    test.type(Activity.jsonSchema.properties.documentId, 'object')
    test.type(Activity.jsonSchema.properties.noteId, 'object')
    test.type(Activity.relationMappings, 'object')
    test.type(Activity.relationMappings.reader, 'object')
    test.type(Activity.relationMappings.document, 'object')
    test.type(Activity.relationMappings.publication, 'object')
    test.type(Activity.relationMappings.note, 'object')
    const metadata = await Activity.fetchTableMetadata()
    test.type(metadata, 'object')
    test.ok(Array.isArray(metadata.columns))
    test.equal(Activity.propertyNameToColumnName('type'), 'type')
    test.equal(Activity.propertyNameToColumnName('readerId'), 'readerId')
    test.equal(
      Activity.propertyNameToColumnName('publicationId'),
      'publicationId'
    )
    test.equal(Activity.propertyNameToColumnName('documentId'), 'documentId')
    test.equal(Activity.propertyNameToColumnName('noteId'), 'noteId')
    test.end()
  })

  test.test('Activity model - create publication', async test => {
    let result, publication, inserted
    await objection
      .transaction(Reader.knex(), async trx => {
        result = await Reader.query()
          .transacting(trx)
          .insertAndFetch({ userId: 'auth0|fakeid2' })
        publication = await Publication.query()
          .transacting(trx)
          .insertGraph({
            bto: result.url,
            name: 'Another Publication',
            attachment: [
              {
                type: 'Document',
                name: 'Test Document',
                content: 'Document content'
              }
            ]
          })
        inserted = await Activity.query()
          .transacting(trx)
          .insertGraphAndFetch({
            type: 'Create',
            actor: {
              type: 'Person',
              id: result.url
            },
            object: {
              type: 'reader:Publication',
              id: publication.url
            }
          })
          .eager('[reader, publication]')
        return trx.rollback()
      })
      .catch(() => {})
    const activity = JSON.parse(JSON.stringify(inserted))
    test.type(activity.id, 'string')
    test.equal(activity.type, 'Create')
    test.type(activity.actor, 'object')
    test.type(activity.actor.id, 'string')
    test.equal(activity.actor.type, 'Person')
    test.type(activity.object, 'object')
    test.type(activity.object.id, 'string')
    test.equal(activity.object.type, 'reader:Publication')
    test.end()
  })

  test.test('Attribution Model - static properties', test => {
    test.ok(Attribution.jsonSchema)
    test.ok(Attribution.tableName)
    test.ok(Attribution.relationMappings)
    test.end()
  })
  test.test('Tag Model - static properties', test => {
    test.ok(Tag.jsonSchema)
    test.ok(Tag.tableName)
    test.ok(Tag.relationMappings)
    test.end()
  })
})

tap.tearDown(async function () {
  await knex.migrate.rollback()
  return knex.destroy()
})
