const assert = require('assert')
const { BaseModel } = require('./BaseModel.js')
const { Model } = require('objection')
const NoSuchReaderError = require('../errors/no-such-reader')
const short = require('short-uuid')
const translator = short()
const _ = require('lodash')

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
  'tag',
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
 * @property {Tag[]} tag - Returns the tags in this Reader's library.
 *
 * The core user object for Rebus Reader. Models references to all of the objects belonging to the reader. Each reader should only be able to see the publications, documents and notes they have uploaded.
 */
class Reader extends BaseModel {
  static async byUserId (userId, namespace = 'auth0') {
    const readers = await Reader.query(Reader.knex()).where(
      'userId',
      '=',
      `${namespace}|${userId}`
    )

    if (readers.length === 0) {
      throw new NoSuchReaderError({ userId })
    } else if (readers.length > 1) {
      throw new Error(`Too many readers for user ${userId}`)
    } else {
      assert(readers.length === 1)
      return readers[0]
    }
  }

  static async byShortId (shortId, eager = []) {
    const id = translator.toUUID(shortId)
    const qb = Reader.query(Reader.knex()).where('id', '=', id)

    eager.forEach(rel => {
      qb.eager(rel)
    })

    const readers = await qb

    if (readers.length === 0) {
      throw new NoSuchReaderError({ shortId })
    } else if (readers.length > 1) {
      throw new Error(`Too many readers for id ${shortId}`)
    } else {
      assert(readers.length === 1)
      return readers[0]
    }
  }

  // IMPORTANT: not tested. Probably doesn't work!!
  static async checkIfExists (shortId) {
    const id = translator.toUUID(shortId.toString())
    const qb = Reader.query(Reader.knex()).where('id', '=', id)
    const readers = await qb
    return readers.length > 0
  }

  // IMPORTANT: not tested. Probably doesn't work!!
  static async createReader (userId, person) {
    let props = _.pick(person, personAttrs)
    props.userId = `auth0|${userId}`
    const createdReader = await Reader.query(Reader.knex()).insertAndFetch(
      props
    )
    return createdReader
  }

  static get tableName () {
    return 'Reader'
  }
  get path () {
    return 'reader'
  }
  static get jsonSchema () {
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
  static get relationMappings () {
    const { Publication } = require('./Publication.js')
    const { Document } = require('./Document.js')
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
      tag: {
        relation: Model.HasManyRelation,
        modelClass: Tag,
        join: {
          from: 'Reader.id',
          to: 'Tag.readerId'
        }
      }
    }
  }

  $formatJson (json) {
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

  asRef () {
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
