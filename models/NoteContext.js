// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')

class NoteContext extends BaseModel {
  static get tableName () /*: string */ {
    return 'NoteContext'
  }
  get path () /*: string */ {
    return 'noteContext'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: ['string', 'null'] },
        description: { type: ['string', 'null'] },
        type: { type: 'string' },
        json: { type: ['object', 'null'] },
        readerId: { type: 'string' },
        notebookId: { type: ['string', 'null'] },
        published: { type: 'string' },
        updated: { type: 'string' }
      },
      required: ['type', 'readerId']
    }
  }
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')
    const { Note } = require('./Note')
    const { Notebook } = require('./Notebook')

    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'NoteContext.readerId',
          to: 'Reader.id'
        }
      },
      notebook: {
        relation: Model.BelongsToOneRelation,
        modelClass: Notebook,
        join: {
          from: 'NoteContext.notebookId',
          to: 'Notebook.id'
        }
      },
      notes: {
        relation: Model.HasManyRelation,
        modelClass: Note,
        join: {
          from: 'NoteContext.id',
          to: 'Note.contextId'
        }
      }
    }
  }

  // ------------------------- GET --------------------

  static async applyFilters (query /*: any */, filters /*: any */) /*:any */ {
    if (filters.notebook) {
      query = query.where('notebookId', '=', urlToId(filters.notebook))
    }

    return await query
  }

  static async byReader (
    id /*: string */,
    filters /*: any */
  ) /*: Promise<Array<any>> */ {
    let query = NoteContext.query()
      .where('readerId', '=', id)
      .whereNull('deleted')
      .withGraphFetched('[notebook, reader]')
      .modifiers({
        notDeleted (builder) {
          builder.whereNull('deleted')
        }
      })

    this.applyFilters(query, filters)

    return await query
  }

  static async byId (id /*: string */) /*: Promise<any> */ {
    const noteContext = await NoteContext.query()
      .findById(id)
      .withGraphFetched(
        `[reader, 
          notebook(notDeleted).collaborators,
          notes(notDeleted).[outlineData, 
            relationsFrom(notDeleted).toNote(notDeleted).body, 
            relationsTo(notDeleted).fromNote(notDeleted).body, 
            body, tags, source(selectSource)]]`
      )
      .modifiers({
        notDeleted (builder) {
          builder.whereNull('deleted')
        },
        selectSource (builder) {
          builder.select('name', 'id')
        }
      })
    if (noteContext) {
      noteContext.notes.forEach((note, index) => {
        noteContext.notes[index].relations = _.concat(
          note.relationsFrom,
          note.relationsTo
        )
        noteContext.notes[index].relationsFrom = null
        noteContext.notes[index].relationsTo = null
      })
    }

    return noteContext
  }

  static async checkIfExists (id /*: string */) /*: Promise<boolean> */ {
    const noteContext = await NoteContext.query().findById(id)
    if (!noteContext || noteContext.deleted) {
      return false
    } else return true
  }

  // ----------------------- CREATE -----------------

  static async createNoteContext (
    object /*: any */,
    readerId /*: string */
  ) /*: Promise<any> */ {
    const props = _.pick(object, [
      'type',
      'name',
      'description',
      'json',
      'notebookId'
    ])
    props.readerId = readerId
    props.id = `${urlToId(readerId)}-${crypto.randomBytes(5).toString('hex')}`
    return await NoteContext.query(NoteContext.knex()).insertAndFetch(props)
  }

  // ---------------- UPDATE ---------------------

  static async update (object /*: any */) /*: Promise<any> */ {
    const props = _.pick(object, [
      'readerId',
      'type',
      'name',
      'description',
      'json',
      'notebookId'
    ])

    return await NoteContext.query(NoteContext.knex()).updateAndFetchById(
      object.id,
      props
    )
  }

  // ------------------- DELETE ------------------

  static async delete (id /*: string */) /*: Promise<any> */ {
    return await NoteContext.query().deleteById(id)
  }

  // --------------------------------------------

  $formatJson (json /*: any */) /*: any */ {
    json = super.$formatJson(json)
    json.shortId = urlToId(json.id)
    json = _.omitBy(json, _.isNil)

    return json
  }
}

module.exports = { NoteContext }
