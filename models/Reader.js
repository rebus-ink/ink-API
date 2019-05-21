const { BaseModel } = require('./BaseModel.js')
const { Model } = require('objection')
const _ = require('lodash')
const { Publication } = require('./Publication')
const { ReadActivity } = require('./ReadActivity')
const { Attribution } = require('./Attribution')
const { urlToId } = require('../utils/utils')
const urlparse = require('url').parse

const attributes = ['id', 'authId', 'name', 'profile', 'json', 'preferences']

/*::
type ReaderType = {
  id: string,
  authId: string,
  name?: string,
  json?: object,
  profile?: object,
  preferences?: object,
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
  static async byAuthId (authId /*: string */) /*: Promise<ReaderType> */ {
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
    const readers = await qb.eager(eager)

    return readers[0]
  }

  static async getLibrary (
    readerId /*: string */,
    limit = 10 /*: number */,
    offset = 0 /*: number */,
    filter /*: any */
  ) {
    const qb = Reader.query(Reader.knex()).where('id', '=', readerId)

    if (filter.attribution && filter.role) {
      const attribution = Attribution.normalizeName(filter.attribution)
      const readers = await qb
        .eager('[tags, publications]')
        .modifyEager('publications', builder => {
          builder
            .joinRelation('attributions')
            .where('attributions.normalizedName', 'like', `%${attribution}%`)
            .andWhere('attributions.role', '=', filter.role)
          builder
            .eager('[tags, attributions]')
            .limit(limit)
            .offset(offset)
        })

      return readers[0]
    }

    if (filter.attribution) {
      const attribution = Attribution.normalizeName(filter.attribution)
      const readers = await qb
        .eager('[tags, publications]')
        .modifyEager('publications', builder => {
          builder
            .joinRelation('attributions')
            .where('attributions.normalizedName', 'like', `%${attribution}%`)
          builder
            .eager('[tags, attributions]')
            .limit(limit)
            .offset(offset)
        })

      return readers[0]
    }

    if (filter.author) {
      const attribution = Attribution.normalizeName(filter.author)
      const readers = await qb
        .eager('[tags, publications]')
        .modifyEager('publications', builder => {
          builder
            .joinRelation('attributions')
            .where('attributions.normalizedName', '=', attribution)
            .andWhere('attributions.role', '=', 'author')
          builder
            .eager('[tags, attributions]')
            .limit(limit)
            .offset(offset)
        })

      return readers[0]
    }

    const readers = await qb
      .eager('[tags, publications.[tags, attributions]]')
      .modifyEager('publications', builder => {
        if (filter.title) {
          builder.whereRaw(
            'LOWER(name) LIKE ?',
            '%' + filter.title.toLowerCase() + '%'
          )
        }
        builder.limit(limit).offset(offset)
      })
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

  static async getNotes (
    readerId /*: string */,
    limit /*: number */,
    offset = 0 /*: number */,
    filters /*: any */
  ) /*: Promise<array<any>> */ {
    const { Document } = require('./Document')
    const qb = Reader.query(Reader.knex()).where('id', '=', readerId)
    let doc
    if (filters.document) {
      const path = urlparse(filters.document).path.substr(45)
      const pubId = urlparse(filters.document).path.substr(13, 32)
      doc = await Document.byPath(pubId, path)
    }

    const readers = await qb
      .eager('replies')
      .modifyEager('replies', builder => {
        if (filters.publication) {
          builder.where('publicationId', '=', urlToId(filters.publication))
        }
        if (filters.document) {
          builder.where('documentId', '=', urlToId(doc.id))
        }
        if (filters.type) {
          builder.where('noteType', '=', filters.type)
        }
        if (filters.search) {
          builder.whereRaw(
            'LOWER(content) LIKE ?',
            '%' + filters.search.toLowerCase() + '%'
          )
        }
        builder.limit(limit).offset(offset)
      })
    return readers[0]
  }

  static async createReader (
    authId,
    person /*: any */
  ) /*: Promise<ReaderType> */ {
    const props = _.pick(person, attributes)

    props.authId = authId
    return await Reader.query(Reader.knex())
      .insert(props)
      .returning('*')
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
          type: 'object',
          additionalProperties: true
        },
        preferences: {
          type: 'object',
          additionalProperties: true
        },
        published: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
        json: {
          type: 'object',
          additionalProperties: true
        }
      },
      // required: ['authId'],
      additionalProperties: true
    }
  }
  static get relationMappings () /*: any */ {
    const { Document } = require('./Document')

    const { Note } = require('./Note.js')
    const { Activity } = require('./Activity.js')
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
    Object.assign(json, {
      id: this.id,
      name: this.name,
      type: 'Person',
      summaryMap: {
        en: `Reader with id ${this.id}`
      },
      inbox: `${this.id}/inbox`,
      outbox: `${this.id}/activity`,
      preferences: this.preferences,
      profile: this.profile,
      json: this.json,
      published: this.published,
      updated: this.updated
    })
    return json
  }

  asRef () /*: {name: string, nameMap: any, summary: any, summaryMap: any, id: string, type: string} */ {
    return {
      id: this.id,
      type: 'Person',
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
