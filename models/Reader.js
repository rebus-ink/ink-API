const { BaseModel } = require('./BaseModel.js')
const { Model } = require('objection')
const _ = require('lodash')
const { Publication } = require('./Publication')
const { urlToId } = require('../routes/utils')

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
  ) /*: Promise<Reader> */ {
    const qb = Reader.query(Reader.knex()).where('id', '=', id)
    const readers = await qb.eager(eager)
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

  static async createReader (
    authId /*: string */,
    person /*: any */
  ) /*: Promise<Reader> */ {
    const props = _.pick(person, attributes)
    props.authId = authId
    const date = new Date().toISOString()
    props.published = date
    props.updated = date
    const createdReader = await Reader.query(Reader.knex()).insertAndFetch(
      props
    )
    return createdReader
  }

  // TODO: update this method when I update publication
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

  // TODO: update this method when I update document
  static async addDocument (
    reader /*: any */,
    document /*: any */
  ) /*: Promise<any> */ {
    if (!document.context) return new Error('no publication')

    document.publicationId = urlToId(document.context)

    try {
      return await reader.$relatedQuery('documents').insert(document)
    } catch (err) {
      if (err.nativeError.code === '23502') {
        // not nullable constraint violation for publicationId
        return new Error('no publication')
      }
    }
  }

  // TODO: update this method when I update note
  static async addNote (reader /*: any */, note /*: any */) /*: Promise<any> */ {
    try {
      return await reader.$relatedQuery('replies').insert(note)
    } catch (err) {
      if (err.nativeError.constraint === 'note_publicationid_foreign') {
        return new Error('no publication')
      } else if (err.nativeError.constraint === 'note_documentid_foreign') {
        return new Error('no document')
      }
    }
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
      // readActivities: {
      //   relation: Model.HasManyRelation,
      //   modelClass: ReadActivity,
      //   join: {
      //     from: 'Reader.id',
      //     to: 'ReadActivity.readerId'
      //   }
      // },
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

  // TODO: find out when this is used.
  $formatJson (json /*: any */) /*: any */ {
    const original = super.$formatJson(json)
    json = original.json || {}
    Object.assign(json, {
      type: 'Person',
      summaryMap: {
        en: `User with id ${this.id}`
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
}

module.exports = { Reader }
