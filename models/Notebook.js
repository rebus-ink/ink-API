// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')

const statusMap = {
  active: 1,
  archived: 2,
  test: 99
}

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
            to: 'notebook_pub.publicationId'
          },
          to: 'Publication.id'
        }
      },
      notes: {
        relation: Model.ManyToManyRelation,
        modelClass: Note,
        join: {
          from: 'Notebook.id',
          through: {
            from: 'notebook_note.notebookId',
            to: 'notebook_note.noteId'
          },
          to: 'Note.id'
        }
      }
    }
  }

  static _validateNotebook (notebook /*: any */) /*: any */ {
    if (notebook.status && !statusMap[notebook.status]) {
      throw new Error(
        `Notebook validation error: ${notebook.status} is not a valid status`
      )
    }

    // validate settings object??
  }

  static _formatNotebook (
    notebook /*: any */,
    readerId /*: string|null */
  ) /*: any */ {
    notebook = _.pick(notebook, ['name', 'description', 'status', 'settings'])
    if (readerId) {
      notebook.readerId = readerId
    }
    if (notebook.status) {
      notebook.status = statusMap[notebook.status]
    } else {
      notebook.status = 1
    }
    return notebook
  }

  static async createNotebook (
    object /*: any */,
    readerId /*: string */
  ) /*: Promise<any> */ {
    this._validateNotebook(object)
    const props = this._formatNotebook(object, readerId)
    props.id = `${urlToId(readerId)}-${crypto.randomBytes(5).toString('hex')}`
    return await Notebook.query(Notebook.knex()).insertAndFetch(props)
  }

  static async byId (id /*: string */) /*: Promise<any> */ {
    return await Notebook.query()
      .findById(id)
      .withGraphFetched(
        '[reader, notebookTags, noteContexts, tags, publications, notes]'
      )
  }

  static async byReader (id /*: string */) /*: Promise<Array<any>> */ {
    return await Notebook.query()
      .where('readerId', '=', id)
      .withGraphFetched('tags')
      .whereNull('deleted')
  }

  static async update (object /*: any */) /*: Promise<any> */ {
    const props = this._formatNotebook(object, null)
    props.readerId = object.readerId

    return await Notebook.query(Notebook.knex())
      .updateAndFetchById(object.id, props)
      .whereNull('deleted')
  }

  static async delete (id /*: string */) /*: Promise<any> */ {
    id = urlToId(id)
    const date = new Date().toISOString()
    return await Notebook.query()
      .patch({ deleted: date })
      .whereNull('deleted')
      .andWhere('id', '=', id)
  }

  $formatJson (json /*: any */) /*: any */ {
    json = super.$formatJson(json)
    json.shortId = urlToId(json.id)
    json = _.omitBy(json, _.isNil)
    if (json.status) {
      const statusString = _.findKey(statusMap, v => {
        return v === json.status
      })
      json.status = statusString
    }
    return json
  }
}

module.exports = { Notebook }
