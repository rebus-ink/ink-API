const { BaseModel } = require('./BaseModel.js')
const { Model } = require('objection')
const _ = require('lodash')
const { Source } = require('./Source')
const { Note } = require('./Note')
const { ReadActivity } = require('./ReadActivity')
const { Tag } = require('./Tag')
const { Attribution } = require('./Attribution')
const { urlToId } = require('../utils/utils')
const { NoteContext } = require('./NoteContext')
const { NoteBody } = require('./NoteBody')
const { NoteRelation } = require('./NoteRelation')
const short = require('short-uuid')
const translator = short()

const attributes = [
  'id',
  'authId',
  'name',
  'profile',
  'json',
  'preferences',
  'profilePicture',
  'username',
  'status',
  'role'
]

const roles = ['reader', 'admin']
const status = ['active', 'inactive', 'deleted']

/*::
type ReaderType = {
  id: string,
  authId: string,
  name?: string,
  json?: Object,
  profile?: Object,
  preferences?: Object,
  profilePicture?: string,
  username?: string,
  status: string,
  role: string,
  published: Date,
  updated: Date
};
*/

class Reader extends BaseModel {
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
        profile: {
          type: ['object', 'null'],
          additionalProperties: true
        }, // deprecated
        preferences: {
          type: ['object', 'null'],
          additionalProperties: true
        },
        username: {
          type: ['string', 'null']
        },
        profilePicture: {
          type: ['string', 'null']
        },
        role: {
          type: ['string', 'null']
        },
        status: {
          type: ['string', 'null']
        },
        published: { type: 'string' },
        updated: { type: 'string' },
        deleted: { type: 'string' },
        json: {
          type: ['object', 'null'],
          additionalProperties: true
        }
      },
      // required: ['authId'],
      additionalProperties: true
    }
  }

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
    if (readers.length === 0 || readers[0].deleted) return null
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
    return readers.length > 0 && !readers[0].deleted
  }

  static _validateReader (object) {
    // role
    if (object.role && roles.indexOf(object.role) === -1) {
      throw new Error(
        `Reader Validation Error: ${object.role} is not a valid value for role`
      )
    }

    // status
    if (object.status && status.indexOf(object.status) === -1) {
      throw new Error(
        `Reader Validation Error: ${
          object.status
        } is not a valid value for status`
      )
    }
  }

  static async createReader (
    authId /*: string */,
    person /*: any */
  ) /*: Promise<ReaderType> */ {
    const props = _.pick(person, attributes)
    props.id = translator.new()
    props.authId = authId

    this._validateReader(props)

    let newReader = await Reader.query(Reader.knex())
      .insert(props)
      .returning('*')

    // create default Tags
    await Tag.createMultipleTags(newReader.id, [
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
        name: 'colour1',
        type: 'colour'
      },
      {
        name: 'colour2',
        type: 'colour'
      },
      {
        name: 'colour3',
        type: 'colour'
      },
      {
        name: 'colour4',
        type: 'colour'
      }
    ])

    return newReader
  }

  static async update (
    id /*: string */,
    object /*: any */
  ) /*: Promise<ReaderType|null> */ {
    const modifications = _.pick(object, [
      'name',
      'preferences',
      'profile',
      'json',
      'username',
      'status',
      'profilePicture',
      'role'
    ])
    this._validateReader(modifications)
    return await Reader.query().updateAndFetchById(urlToId(id), modifications)
  }

  static async softDelete (id /*: string */) /*: Promise<number> */ {
    id = urlToId(id)
    const now = new Date().toISOString()
    await Source.query()
      .patch({ deleted: now })
      .where('readerId', '=', id)
    await NoteContext.query()
      .patch({ deleted: now })
      .where('readerId', '=', id)
    await Note.query()
      .patch({ deleted: now })
      .where('readerId', '=', id)
    await Tag.query()
      .patch({ deleted: now })
      .where('readerId', '=', id)
    await Attribution.query()
      .patch({ deleted: now })
      .where('readerId', '=', id)
    await NoteBody.query()
      .patch({ deleted: now })
      .where('readerId', '=', id)
    await NoteRelation.query()
      .patch({ deleted: now })
      .where('readerId', '=', id)

    return await Reader.query().patchAndFetchById(id, {
      deleted: now,
      status: 'deleted'
    })
  }

  static get relationMappings () /*: any */ {
    return {
      sources: {
        relation: Model.HasManyRelation,
        modelClass: Source,
        join: {
          from: 'Reader.id',
          to: 'Source.readerId'
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
      replies: {
        relation: Model.HasManyRelation,
        modelClass: Note,
        join: {
          from: 'Reader.id',
          to: 'Note.readerId'
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
      'username',
      'profilePicture',
      'status',
      'role',
      'updated'
    ])
    json.shortId = urlToId(json.id)

    return json
  }

  $beforeInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeInsert(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.updated = doc.published
    })
  }
}

module.exports = { Reader }
