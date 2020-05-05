// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')

class Notebook extends BaseModel {
  static get tableName () /*: string */ {
    return 'Notebook'
  }
  get path () /*: string */ {
    return 'notebook'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: ['string', 'null'] },
        status: { type: 'number' }, // should have a default value?
        settings: { type: ['object', 'null'] },
        readerId: { type: 'string' },
        published: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' }
      },
      required: ['name', 'readerId', 'status']
    }
  }
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')
    const { Note } = require('./Note')
    const { NoteContext } = require('./NoteContext')
    const { Tag } = require('./Tag')
    const { Publication } = require('./Publication')

    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Notebook.readerId',
          to: 'Reader.id'
        }
      },
      noteContexts: {
        relation: Model.HasManyRelation,
        modelClass: NoteContext,
        join: {
          from: 'Notebook.id',
          to: 'NoteContext.notebookId'
        }
      },
      notebookTags: {
        relation: Model.HasManyRelation,
        modelClass: Tag,
        join: {
          from: 'Notebook.id',
          to: 'Tag.notebookId'
        }
      },
      tags: {
        relation: Model.ManyToManyRelation,
        modelClass: Tag,
        join: {
          from: 'Notebook.id',
          through: {
            from: 'notebook_tag.notebookId',
            to: 'notebook_tag.tagId'
          },
          to: 'Tag.id'
        }
      },
      publications: {
        relation: Model.ManyToManyRelation,
        modelClass: Publication,
        join: {
          from: 'Notebook.id',
          through: {
            from: 'notebook_pub.notebookId',
            to: 'notebook_pub.pubId'
          },
          to: 'Publication.id'
        }
      }
    }
  }

  static async createNotebook (
    object /*: any */,
    readerId /*: string */
  ) /*: Promise<any> */ {
    const props = _.pick(object, ['status', 'name', 'description', 'settings'])
    props.readerId = readerId
    props.id = `${urlToId(readerId)}-${crypto.randomBytes(5).toString('hex')}`

    return await Notebook.query(Notebook.knex()).insertAndFetch(props)
  }

  static async byId (id /*: string */) /*: Promise<any> */ {
    return await Notebook.query()
      .findById(id)
      .withGraphFetched(
        '[reader, notebookTags, noteContexts]' // add
      )
  }

  static async update (object /*: any */) /*: Promise<any> */ {
    const props = _.pick(object, [
      'readerId',
      'status',
      'name',
      'description',
      'settings'
    ])

    return await Notebook.query(Notebook.knex()).updateAndFetchById(
      object.id,
      props
    )
  }

  $formatJson (json /*: any */) /*: any */ {
    json = super.$formatJson(json)
    json.shortId = urlToId(json.id)
    json = _.omitBy(json, _.isNil)

    return json
  }
}

module.exports = { Notebook }
