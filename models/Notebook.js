// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const { Notebook_Note } = require('./Notebook_Note')
const { Notebook_Source } = require('./Notebook_Source')
const { Notebook_Tag } = require('./Notebook_Tag')
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
        published: { type: 'string' },
        updated: { type: 'string' }
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
    const { Collaborator } = require('./Collaborator')

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
      },
      collaborators: {
        relation: Model.HasManyRelation,
        modelClass: Collaborator,
        join: {
          from: 'Notebook.id',
          to: 'Collaborator.notebookId'
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
        '[reader, notes(notDeleted).[body, tags(notDeleted), source(notDeleted)], notebookTags(notDeleted), noteContexts(notDeleted), tags(notDeleted), collaborators(notDeleted).reader, sources(notDeleted, notReferenced).[tags, attributions]]'
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

  /*
  Warning: does not throw errors
  */
  static async createMultipleNotebooks (
    readerId /*: string */,
    notebooks /*: Array<any> */
  ) /*: Promise<any> */ {
    const notebookArray = notebooks.map(notebook => {
      const formattedNotebook = this._formatNotebook(notebook, readerId)
      formattedNotebook.id = `${urlToId(readerId)}-${crypto
        .randomBytes(5)
        .toString('hex')}`
      return formattedNotebook
    })

    try {
      return await Notebook.query().insert(notebookArray)
    } catch (err) {
      // if inserting all the notebooks at once failed, do one at a time, ignoring errors
      let createdNotebooks = []
      notebookArray.forEach(async notebook => {
        try {
          let createdNotebook = await this.createNotebook(readerId, notebook)
          createdNotebooks.push(createdNotebook)
        } catch (err2) {
          // eslint-disable-next-line
          return
        }
      })
      return createdNotebooks
    }
  }

  static async applyFilters (query /*: any */, filters /*: any */) /*:any */ {
    if (filters.search) {
      if (filters.name !== false && filters.description !== false) {
        query = query.where(nestedQuery => {
          nestedQuery
            .where(
              'Notebook.name',
              'ilike',
              '%' + filters.search.toLowerCase() + '%'
            )
            .orWhere(
              'Notebook.description',
              'ilike',
              '%' + filters.search.toLowerCase() + '%'
            )
        })
      } else if (filters.name) {
        query = query.where(
          'Notebook.name',
          'ilike',
          '%' + filters.search.toLowerCase() + '%'
        )
      } else if (filters.description) {
        query = query.where(
          'Notebook.description',
          'ilike',
          '%' + filters.search.toLowerCase() + '%'
        )
      }
    }

    if (filters.status) {
      const status = statusMap[filters.status]
      query = query.where('Notebook.status', '=', status)
    }

    if (filters.colour) {
      query = query.whereJsonSupersetOf('Notebook.settings', {
        colour: filters.colour
      })
    }

    return await query
  }

  static async byReader (
    id /*: string */,
    limit /*: number */ = 10,
    skip /*: number */ = 0,
    filters /*: any */ = {}
  ) /*: Promise<Array<any>> */ {
    id = urlToId(id)
    let query = Notebook.query()
      .where('Notebook.readerId', '=', id)
      .whereNull('deleted')
      .limit(limit)
      .offset(skip)
      .withGraphFetched('tags')

    // catch special case in advanced search:
    if (filters.name === false && filters.description === false) return []

    // filters
    this.applyFilters(query, filters)

    // orderBy
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

    let result = await query
    if (filters.collaboration) {
      let collabQuery = Notebook.query()
        .whereNull('Notebook.deleted')
        .withGraphFetched('collaborators')
        .where('Collaborator.readerId', '=', id)
        .leftJoin('Collaborator', 'Collaborator.notebookId', '=', 'Notebook.id')
        .andWhere('Collaborator.status', '=', 2)
        .groupBy('Notebook.id')
      collabQuery = this.applyFilters(collabQuery, filters)
      let collabResult = await collabQuery
      result = result.concat(collabResult)
    }

    return result
  }

  static async count (
    id /*: string */,
    filters /*: any */
  ) /*: Promise<number> */ {
    id = urlToId(id)
    let query = Notebook.query()
      .where('readerId', '=', id)
      .whereNull('deleted')
    // catch special case in advanced search:
    if (filters.name === false && filters.description === false) return 0
    this.applyFilters(query, filters)

    const result = await query

    return result.length
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
    await Notebook_Note.deleteNoteOfNotebooks(id)
    await Notebook_Source.deleteSourceOfNotebooks(id)
    await Notebook_Tag.deleteTagOfNotebooks(id)
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
