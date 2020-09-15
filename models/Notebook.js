// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')
const debug = require('debug')('ink:models:Notebook')

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
    const { Source } = require('./Source')

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
      sources: {
        relation: Model.ManyToManyRelation,
        modelClass: Source,
        join: {
          from: 'Notebook.id',
          through: {
            from: 'notebook_source.notebookId',
            to: 'notebook_source.sourceId'
          },
          to: 'Source.id'
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
    debug('**validateNotebook**')
    debug('notebook: ', notebook)
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
    debug('**_formatNotebook**')
    debug('notebook: ', notebook)
    debug('readerId: ', readerId)
    notebook = _.pick(notebook, ['name', 'description', 'status', 'settings'])
    if (readerId) {
      notebook.readerId = readerId
    }
    if (notebook.status) {
      notebook.status = statusMap[notebook.status]
    } else {
      notebook.status = 1
    }
    debug('formatted notebook: ', notebook)
    return notebook
  }

  static async createNotebook (
    object /*: any */,
    readerId /*: string */
  ) /*: Promise<any> */ {
    debug('**createNotebook**')
    debug('object: ', object)
    debug('readerId: ', readerId)
    this._validateNotebook(object)
    const props = this._formatNotebook(object, readerId)
    props.id = `${urlToId(readerId)}-${crypto.randomBytes(5).toString('hex')}`
    debug('props to be added to database: ', props)
    return await Notebook.query(Notebook.knex()).insertAndFetch(props)
  }

  static async byId (id /*: string */) /*: Promise<any> */ {
    debug('**byId**')
    debug('id: ', id)
    return await Notebook.query()
      .findById(id)
      .withGraphFetched(
        '[reader, notes(notDeleted).[body, tags(notDeleted), source(notDeleted)], notebookTags(notDeleted), noteContexts(notDeleted), tags(notDeleted), sources(notDeleted, notReferenced).[tags]]'
      )
      .modifiers({
        notDeleted (builder) {
          builder.whereNull('deleted')
        },
        notReferenced (builder) {
          builder.whereNull('referenced')
        }
      })
      .whereNull('deleted')
  }

  static async applyFilters (query /*: any */, filters /*: any */) {
    debug('**applyFilters**')
    debug('filters: ', filters)
    if (filters.search) {
      query = query.where(nestedQuery => {
        nestedQuery
          .where('name', 'ilike', '%' + filters.search.toLowerCase() + '%')
          .orWhere(
            'description',
            'ilike',
            '%' + filters.search.toLowerCase() + '%'
          )
      })
    }

    if (filters.status) {
      const status = statusMap[filters.status]
      query = query.where('status', '=', status)
    }

    if (filters.colour) {
      query = query.whereJsonSupersetOf('settings', { colour: filters.colour })
    }

    return await query
  }

  static async byReader (
    id /*: string */,
    limit /*: number */ = 10,
    skip /*: number */ = 0,
    filters /*: any */ = {}
  ) /*: Promise<Array<any>> */ {
    debug('**byReader**')
    debug('id: ', id, 'limit: ', limit, 'skip: ', skip)
    debug('filters: ', filters)
    let query = Notebook.query()
      .where('readerId', '=', id)
      .whereNull('deleted')
      .limit(limit)
      .offset(skip)
      .withGraphFetched('tags')

    this.applyFilters(query, filters)

    if (filters.orderBy === 'name') {
      if (filters.reverse) {
        query = query.orderByRaw('LOWER(name) desc')
      } else {
        query = query.orderByRaw('LOWER(name) asc')
      }
    } else if (filters.orderBy === 'created') {
      if (filters.reverse) {
        query = query.orderBy('published')
      } else {
        query = query.orderBy('published', 'desc')
      }
    } else {
      if (filters.reverse) {
        query = query.orderBy('updated')
      } else {
        query = query.orderBy('updated', 'desc')
      }
    }

    return await query
  }

  static async count (
    id /*: string */,
    filters /*: any */
  ) /*: Promise<number> */ {
    debug('**count**')
    debug('id: ', id)
    debug('filters: ', filters)
    let query = Notebook.query()
      .where('readerId', '=', id)
      .whereNull('deleted')

    this.applyFilters(query, filters)

    const result = await query

    return result.length
  }

  static async update (object /*: any */) /*: Promise<any> */ {
    debug('**update**')
    debug('object: ', object)
    const props = this._formatNotebook(object, null)
    props.readerId = object.readerId

    return await Notebook.query(Notebook.knex())
      .updateAndFetchById(object.id, props)
      .whereNull('deleted')
  }

  static async delete (id /*: string */) /*: Promise<any> */ {
    debug('**delete**')
    id = urlToId(id)
    debug('id: ', id)
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
