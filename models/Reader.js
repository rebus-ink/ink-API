const { BaseModel } = require('./BaseModel.js')
const { Model } = require('objection')
const _ = require('lodash')
const { Publication } = require('./Publication')
const { Note } = require('./Note')
const { ReadActivity } = require('./ReadActivity')
const { Job } = require('./Job')
const { Tag } = require('./Tag')
const { Attribution } = require('./Attribution')
const { urlToId } = require('../utils/utils')

const short = require('short-uuid')
const translator = short()

const attributes = ['id', 'authId', 'name', 'profile', 'json', 'preferences']

/*::
type ReaderType = {
  id: string,
  authId: string,
  name?: string,
  json?: Object,
  profile?: Object,
  preferences?: Object,
  published: Date,
  updated: Date
};
*/

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
  static async byAuthId (authId /*: string */) /*: Promise<Reader> */ {
    const readers = await Reader.query(Reader.knex()).where(
      'authId',
      '=',
      authId
    )
    return readers[0]
  }

  static async byId (
    id /*: string */,
    eager /*: string */
  ) /*: Promise<ReaderType> */ {
    const qb = Reader.query(Reader.knex()).where('id', '=', id)
    const readers = await qb.withGraphFetched(eager)

    return readers[0]
  }

  static async checkIfExistsByAuthId (
    authId /*: string */
  ) /*: Promise<boolean> */ {
    const readers = await Reader.query(Reader.knex()).where(
      'authId',
      '=',
      authId
    )
    return readers.length > 0
  }

  static async checkIfExistsById (id /*: string */) /*: Promise<boolean> */ {
    const readers = await Reader.query(Reader.knex()).where('id', '=', id)
    return readers.length > 0
  }

  static async createReader (
    authId /*: string */,
    person /*: any */
  ) /*: Promise<ReaderType> */ {
    const props = _.pick(person, attributes)
    props.id = translator.new()
    props.authId = authId
    let newReader
    try {
      newReader = await Reader.query(Reader.knex())
        .insert(props)
        .returning('*')
    } catch (err) {
      throw err
    }

    // create default Tags
    await Tag.createMultipleTags(newReader.id, [
      {
        name: 'Research',
        type: 'workspace'
      },
      {
        name: 'Teaching',
        type: 'workspace'
      },
      {
        name: 'Public Scholarships',
        type: 'workspace'
      },
      {
        name: 'Personal',
        type: 'workspace'
      },
      {
        name: 'important',
        type: 'flag'
      },
      {
        name: 'question',
        type: 'flag'
      },
      {
        name: 'revisit',
        type: 'flag'
      },
      {
        name: 'to do',
        type: 'flag'
      },
      {
        name: 'idea',
        type: 'flag'
      },
      {
        name: 'important term',
        type: 'flag'
      },
      {
        name: 'further reading',
        type: 'flag'
      },
      {
        name: 'urgent',
        type: 'flag'
      },
      {
        name: 'reference',
        type: 'flag'
      },
      {
        name: 'colour 1',
        type: 'flag'
      },
      {
        name: 'colour 2',
        type: 'flag'
      },
      {
        name: 'colour 3',
        type: 'flag'
      },
      {
        name: 'colour 4',
        type: 'flag'
      }
    ])

    return newReader
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
      title: 'Reader Profile',
      properties: {
        id: { type: 'string' },
        authId: { type: 'string' },
        type: { const: 'Person' },
        profile: {
          type: ['object', 'null'],
          additionalProperties: true
        },
        preferences: {
          type: ['object', 'null'],
          additionalProperties: true
        },
        published: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
        json: {
          type: ['object', 'null'],
          additionalProperties: true
        }
      },
      // required: ['authId'],
      additionalProperties: true
    }
  }

  static async update (
    id /*: string */,
    object /*: any */
  ) /*: Promise<ReaderType|null> */ {
    const modifications = _.pick(object, [
      'name',
      'preferences',
      'profile',
      'json'
    ])
    return await Reader.query().updateAndFetchById(urlToId(id), modifications)
  }

  static get relationMappings () /*: any */ {
    const { Document } = require('./Document')
    return {
      publications: {
        relation: Model.HasManyRelation,
        modelClass: Publication,
        join: {
          from: 'Reader.id',
          to: 'Publication.readerId'
        }
      },
      readActivities: {
        relation: Model.HasManyRelation,
        modelClass: ReadActivity,
        join: {
          from: 'Reader.id',
          to: 'readActivity.readerId'
        }
      },
      jobs: {
        relation: Model.HasManyRelation,
        modelClass: Job,
        join: {
          from: 'Reader.id',
          to: 'job.readerId'
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
    json = super.$formatJson(json)
    json = _.pick(json, [
      'id',
      'name',
      'preferences',
      'profile',
      'json',
      'published',
      'updated'
    ])
    json.shortId = urlToId(json.id)

    return json
  }

  asRef () /*: {name: string, id: string, type: string} */ {
    return {
      id: this.id,
      name: this.name
    }
  }

  $beforeInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeInsert(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.updated = new Date().toISOString()
    })
  }
}

module.exports = { Reader }
