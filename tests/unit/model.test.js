'use strict'
let config
/* istanbul ignore next */
if (process.env.POSTGRE_INSTANCE) {
  config = require('../../knexfile.js')['postgresql']
} else {
  config = require('../../knexfile.js')['development']
}
const knex = require('knex')(config)
const objection = require('objection')
const Model = objection.Model
Model.knex(knex)
const { Reader } = require('../../models/Reader')
const { Publication } = require('../../models/Publication')
const { Document } = require('../../models/Document')
const { Note } = require('../../models/Note')
const { Activity } = require('../../models/Activity')
const { Attribution } = require('../../models/Attribution')
const { Tag } = require('../../models/Tag')
const tap = require('tap')

tap.test('Models', async test => {
  await knex.migrate.latest()

  test.test('Reader jsonSchema', testResult => {
    testResult.ok(Reader.jsonSchema)
    testResult.ok(Reader.relationMappings)
    testResult.end()
  })

  test.test('Reader model', async testResult => {
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
    testResult.ok(reader.published)
    testResult.ok(reader.updated)
    testResult.ok(reader.id.includes('reader-'))
    testResult.equals(publication.json.name, 'Bingo! The Publication')
    testResult.notOk(publication.json.bto)
    testResult.ok(publication.url.includes('publication-'))
    testResult.ok(docs[0])
    testResult.ok(docs[0].id)
    testResult.ok(docs[0].url.includes('document-'))
    testResult.ok(notes[0])
    testResult.ok(notes[0].id)
    testResult.ok(notes[0].url.includes('reader-'))
    testResult.end()
  })

  test.test('Reader model - update', async testResult => {
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
    testResult.equals(updated.json.summary, 'Anonymous')
    testResult.end()
  })
  test.test('Publication Model - static properties', testResult => {
    testResult.ok(Publication.jsonSchema)
    testResult.ok(Publication.tableName)
    testResult.ok(Publication.relationMappings)
    testResult.end()
  })
  test.test('Document Model - static properties', testResult => {
    testResult.ok(Document.jsonSchema)
    testResult.ok(Document.tableName)
    testResult.ok(Document.relationMappings)
    testResult.end()
  })
  test.test('Note Model - static properties', testResult => {
    testResult.ok(Note.jsonSchema)
    testResult.ok(Note.tableName)
    testResult.ok(Note.relationMappings)
    testResult.end()
  })
  test.test('Activity Model - static properties', async testResult => {
    testResult.equal(Activity.tableName, 'Activity')
    testResult.type(Activity.jsonSchema, 'object')
    testResult.type(Activity.jsonSchema.properties, 'object')
    testResult.type(Activity.jsonSchema.properties.type, 'object')
    testResult.type(Activity.jsonSchema.properties.readerId, 'object')
    testResult.type(Activity.jsonSchema.properties.publicationId, 'object')
    testResult.type(Activity.jsonSchema.properties.documentId, 'object')
    testResult.type(Activity.jsonSchema.properties.noteId, 'object')
    testResult.type(Activity.relationMappings, 'object')
    testResult.type(Activity.relationMappings.reader, 'object')
    testResult.type(Activity.relationMappings.document, 'object')
    testResult.type(Activity.relationMappings.publication, 'object')
    testResult.type(Activity.relationMappings.note, 'object')
    const metadata = await Activity.fetchTableMetadata()
    testResult.type(metadata, 'object')
    testResult.ok(Array.isArray(metadata.columns))
    testResult.equal(Activity.propertyNameToColumnName('type'), 'type')
    testResult.equal(Activity.propertyNameToColumnName('readerId'), 'readerId')
    testResult.equal(
      Activity.propertyNameToColumnName('publicationId'),
      'publicationId'
    )
    testResult.equal(
      Activity.propertyNameToColumnName('documentId'),
      'documentId'
    )
    testResult.equal(Activity.propertyNameToColumnName('noteId'), 'noteId')
    testResult.end()
  })

  test.test('Activity model - create publication', async testResult => {
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
    testResult.type(activity.id, 'string')
    testResult.equal(activity.type, 'Create')
    testResult.type(activity.actor, 'object')
    testResult.type(activity.actor.id, 'string')
    testResult.equal(activity.actor.type, 'Person')
    testResult.type(activity.object, 'object')
    testResult.type(activity.object.id, 'string')
    testResult.equal(activity.object.type, 'reader:Publication')
    testResult.end()
  })

  test.test('Attribution Model - static properties', testResult => {
    testResult.ok(Attribution.jsonSchema)
    testResult.ok(Attribution.tableName)
    testResult.ok(Attribution.relationMappings)
    testResult.end()
  })
  test.test('Tag Model - static properties', testResult => {
    testResult.ok(Tag.tableName)
    testResult.end()
  })
})

tap.tearDown(async function () {
  await knex.migrate.rollback()
  return knex.destroy()
})
