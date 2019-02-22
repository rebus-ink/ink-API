const assert = require('assert')
const { BaseModel } = require('./BaseModel.js')
const { Model } = require('objection')
const short = require('short-uuid')
const translator = short()
const _ = require('lodash')
const { Publication } = require('./Publication')
const { urlToId, urlToShortId } = require('../routes/utils')

const personAttrs = [
  'attachment',
  'attributedTo',
  'audience',
  'content',
  'context',
  'contentMap',
  'name',
  'nameMap',
  'endTime',
  'generator',
  'icon',
  'image',
  'inReplyTo',
  'location',
  'preview',
  'published',
  'replies',
  'startTime',
  'summary',
  'summaryMap',
  'tags',
  'updated',
  'url',
  'to',
  'bto',
  'cc',
  'bcc',
  'mediaType',
  'duration'
]

/**
 * @property {User} user - Returns the user (with auth info) associated with this reader.
 * @property {Document[]} documents - Returns the documents owned buy this Reader.
 * @property {Publication[]} publications - Returns the publications owned buy this Reader.
 * @property {Note[]} replies - Returns the notes owned by this Reader.
 * @property {Activity[]} outbox - Returns the activities by this Reader.
 * @property {Attribution[]} attributions - Returns the creators/contributors in this Reader's library. How do we surface this in the Activity Streams JSON?
 * @property {Tag[]} tags - Returns the tags in this Reader's library.
 *
 * The core user object for Rebus Reader. Models references to all of the objects belonging to the reader. Each reader should only be able to see the publications, documents and notes they have uploaded.
 */
class Reader extends BaseModel {
  static async byUserId (
    userId /*: string */,
    namespace = 'auth0' /*: string */
  ) /*: any */ {
    const readers = await Reader.query(Reader.knex()).where(
      'userId',
      '=',
      `${namespace}|${userId}`
    )

    if (readers.length === 0) {
      return null
    } else if (readers.length > 1) {
      throw new Error(`Too many readers for user ${userId}`)
    } else {
      assert(readers.length === 1)
      return readers[0]
    }
  }

  static async byShortId (
    shortId /*: string */,
    eager /*: string */
  ) /*: any */ {
    const id = translator.toUUID(shortId)
    const qb = Reader.query(Reader.knex()).where('id', '=', id)
    const readers = await qb.eager(eager)
    if (readers.length === 0) {
      return null
    } else if (readers.length > 1) {
      throw new Error(`Too many readers for id ${shortId}`)
    } else {
      assert(readers.length === 1)
      return readers[0]
    }
  }

  static async checkIfExists (id /*: string */) /*: Promise<boolean> */ {
    const userId = `auth0|${id}`
    const qb = Reader.query(Reader.knex()).where('userId', '=', userId)
    const readers = await qb
    return readers.length > 0
  }

  static async createReader (
    userId /*: string */,
    person /*: any */
  ) /*: Promise<any> */ {
    let props = _.pick(person, personAttrs)
    props.userId = `auth0|${userId}`
    const createdReader = await Reader.query(Reader.knex()).insertAndFetch(
      props
    )
    return createdReader
  }

  static async addPublication (
    reader /*: any */,
    publication /*: any */
  ) /*: any */ {
    const related = {
      bto: reader.url,
      attachment: publication.orderedItems
    }
    const graph = Object.assign(
      related,
      _.omit(publication, ['orderedItems', 'totalItems'])
    )
    return reader.$relatedQuery('publications').insertGraph(graph)
  }

  static async addDocument (
    reader /*: any */,
    document /*: any */
  ) /*: Promise<any> */ {
    if (!document.context) return new Error('no publication')
    document.publicationId = urlToId(document.context)

    // check that publication exists
    let publication = await Publication.query().findById(document.publicationId)
    if (!publication) {
      return new Error('no publication')
    }

    return reader.$relatedQuery('documents').insert(document)
  }

  static async addNote (reader /*: any */, note /*: any */) /*: Promise<any> */ {
    // check that document exists, publication exists and document belongs to publication

    const { Document } = require('./Document')

    if (!note.inReplyTo) return new Error('no document')
    const document = await Document.byShortId(urlToShortId(note.inReplyTo))
    if (!document) return new Error('no document')

    if (!note.context) return new Error('no publication')
    const publication = await Publication.byShortId(urlToShortId(note.context))
    if (!publication) return new Error('no publication')

    if (document.publicationId !== publication.id) {
      return new Error('wrong publication')
    }

    return reader.$relatedQuery('replies').insert(note)
  }

  static async addTag (
    reader /*: any */,
    tag /*: {type: string, name: string} */
  ) /*: Promise<{
    json: {type: string, name: string},
    readerId: string,
    id: string,
    published: string
  }> */ {
    return reader.$relatedQuery('tags').insert(tag)
  }

  static get tableName () /*: string */ {
    return 'Reader'
  }
  get path () /*: string */ {
    return 'reader'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      title: 'User Profile',
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'string' },
        published: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
        json: {
          type: 'object',
          properties: {
            type: { const: 'Person' }
          },
          additionalProperties: true
        }
      },
      required: ['userId'],
      additionalProperties: true
    }
  }
  static get relationMappings () /*: any */ {
    const { Document } = require('./Document')

    const { Note } = require('./Note.js')
    const { Activity } = require('./Activity.js')
    const { Attribution } = require('./Attribution.js')
    const { Tag } = require('./Tag.js')
    return {
      publications: {
        relation: Model.HasManyRelation,
        modelClass: Publication,
        join: {
          from: 'Reader.id',
          to: 'Publication.readerId'
        }
      },
      outbox: {
        relation: Model.HasManyRelation,
        modelClass: Activity,
        join: {
          from: 'Reader.id',
          to: 'Activity.readerId'
        }
      },
      replies: {
        relation: Model.HasManyRelation,
        modelClass: Note,
        join: {
          from: 'Reader.id',
          to: 'Note.readerId'
        }
      },
      documents: {
        relation: Model.HasManyRelation,
        modelClass: Document,
        join: {
          from: 'Reader.id',
          to: 'Document.readerId'
        }
      },
      attributions: {
        relation: Model.HasManyRelation,
        modelClass: Attribution,
        join: {
          from: 'Reader.id',
          to: 'Attribution.readerId'
        }
      },
      tags: {
        relation: Model.HasManyRelation,
        modelClass: Tag,
        join: {
          from: 'Reader.id',
          to: 'Tag.readerId'
        }
      }
    }
  }

  $formatJson (json /*: any */) /*: any */ {
    const original = super.$formatJson(json)
    json = original.json || {}
    Object.assign(json, {
      type: 'Person',
      summaryMap: {
        en: `User with id ${this.id}`
      },
      id: this.url,
      inbox: `${this.url}/inbox`,
      outbox: `${this.url}/activity`,
      streams: {
        id: `${this.url}/streams`,
        type: 'Collection',
        summaryMap: {
          en: `Collections for user with id ${this.id}`
        },
        totalItems: 1,
        items: [
          {
            summaryMap: {
              en: `Library for user with id ${this.id}`
            },
            id: `${this.url}/library`,
            type: 'Collection'
          }
        ]
      },
      published: this.published,
      updated: this.updated
    })
    return json
  }

  asRef () /*: {name: string, nameMap: any, summary: any, summaryMap: any, id: string, type: string} */ {
    return Object.assign(
      _.pick(this.json, ['name', 'nameMap', 'summary', 'summaryMap']),
      {
        id: this.url,
        type: 'Person'
      }
    )
  }
}

module.exports = { Reader }
