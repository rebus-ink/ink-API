// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')
const { NoteBody } = require('./NoteBody')
const { Notebook_Note } = require('./Notebook_Note')
const debug = require('debug')('ink:models:Note')

/*::
type NoteType = {
  id?: string,
  readerId: string,
  canonical?: string,
  stylesheet?: Object,
  target? : Object,
  body?: Object,
  json?: Object,
  document?: string,
  sourceId?: string,
  contextId?: string,
  original?: string,
  previous?: string,
  next?: string,
  published: Date,
  updated?: Date
};
*/

class Note extends BaseModel {
  static get tableName () /*: string */ {
    return 'Note'
  }
  get path () /*: string */ {
    return 'note'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        readerId: { type: 'string ' },
        canonical: { type: ['string', 'null'] },
        stylesheet: { type: ['object', 'null'] },
        target: { type: ['object', 'null'] },
        sourceId: { type: ['string', 'null'] },
        document: { type: ['string', 'null'] },
        body: { type: 'object' },
        json: { type: ['object', 'null'] },
        contextId: { type: ['string', 'null'] },
        original: { type: ['string', 'null'] },
        previous: { type: ['string', 'null'] },
        next: { type: ['string', 'null'] },
        parentId: { type: ['string', 'null'] },
        updated: { type: 'string', format: 'date-time' },
        published: { type: 'string', format: 'date-time' },
        deleted: { type: 'string', format: 'date-time' },
        emptied: { type: 'string', format: 'date-time' }
      },
      additionalProperties: true,
      required: ['readerId']
    }
  }

  static get relationMappings () /*: any */ {
    const { Source } = require('./Source.js')
    const { Reader } = require('./Reader.js')
    const { Tag } = require('./Tag.js')
    const { NoteRelation } = require('./NoteRelation')
    const { NoteContext } = require('./NoteContext')
    const { Notebook } = require('./Notebook')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Note.readerId',
          to: 'Reader.id'
        }
      },
      source: {
        relation: Model.BelongsToOneRelation,
        modelClass: Source,
        join: {
          from: 'Note.sourceId',
          to: 'Source.id'
        }
      },
      body: {
        relation: Model.HasManyRelation,
        modelClass: NoteBody,
        join: {
          from: 'Note.id',
          to: 'NoteBody.noteId'
        }
      },
      relationsTo: {
        relation: Model.HasManyRelation,
        modelClass: NoteRelation,
        join: {
          from: 'Note.id',
          to: 'NoteRelation.to'
        }
      },
      relationsFrom: {
        relation: Model.HasManyRelation,
        modelClass: NoteRelation,
        join: {
          from: 'Note.id',
          to: 'NoteRelation.from'
        }
      },
      context: {
        relation: Model.BelongsToOneRelation,
        modelClass: NoteContext,
        join: {
          from: 'Note.contextId',
          to: 'NoteContext.id'
        }
      },
      tags: {
        relation: Model.ManyToManyRelation,
        modelClass: Tag,
        join: {
          from: 'Note.id',
          through: {
            from: 'note_tag.noteId',
            to: 'note_tag.tagId'
          },
          to: 'Tag.id'
        }
      },
      notebooks: {
        relation: Model.ManyToManyRelation,
        modelClass: Notebook,
        join: {
          from: 'Note.id',
          through: {
            from: 'notebook_note.noteId',
            to: 'notebook_note.notebookId'
          },
          to: 'Notebook.id'
        }
      }
    }
  }

  static async _formatIncomingNote (
    note /*: NoteType */
  ) /*: Promise<NoteType> */ {
    debug('**_formatIncomingNote**')
    debug('note: ', note)
    const props = _.pick(note, [
      'canonical',
      'stylesheet',
      'target',
      'sourceId',
      'json',
      'readerId',
      'document',
      'contextId',
      'previous',
      'next',
      'parentId'
    ])
    if (note.id) props.id = urlToId(note.id)
    debug('note formatted: ', props)
    return props
  }

  static async createNoteInNotebook (
    reader /*: any */,
    notebookId /*: string */,
    note /*: any */
  ) {
    debug('**createNoteInNotebook**')
    debug('reader: ', reader)
    debug('notebookId: ', notebookId)
    debug('note: ', note)
    const createdNote = await this.createNote(reader, note)
    debug('created note: ', createdNote)
    if (createdNote) {
      try {
        // $FlowFixMe
        await Notebook_Note.addNoteToNotebook(
          notebookId,
          // $FlowFixMe
          urlToId(createdNote.id)
        )
      } catch (err) {
        debug('error when adding to notebook: ', err.message)
        this.hardDelete(createdNote.id)
        throw err
      }
    }

    return createdNote
  }

  static async hardDelete (noteId /*: ?string */) {
    debug('**hardDelete**')
    debug('noteId: ', noteId)
    noteId = urlToId(noteId)
    await Note.query()
      .delete()
      .where({
        id: noteId
      })
  }

  static async createNote (
    reader /*: any */,
    note /*: any */
  ) /*: Promise<NoteType|Error> */ {
    debug('**createNote**')
    debug('incoming note: ', note)
    debug('reader: ', reader)

    let props = await Note._formatIncomingNote(note)

    props.readerId = reader.id
    props.id = `${urlToId(reader.id)}-${crypto.randomBytes(5).toString('hex')}`

    let createdNote
    let noteBodyError

    if (!note.body) {
      throw new Error(
        'Create Note Validation Error: body is a required property'
      )
    }

    try {
      createdNote = await Note.query().insertAndFetch(props)
      debug('created note: ', createdNote)
    } catch (err) {
      debug('error: ', err.message)
      if (err.constraint === 'note_sourceid_foreign') {
        throw new Error('no source')
      } else if (err.constraint === 'note_contextid_foreign') {
        throw new Error('no context')
      } else if (err.constraint === 'note_previous_foreign') {
        throw new Error('no previous')
      } else if (err.constraint === 'note_next_foreign') {
        throw new Error('no next')
      }
      throw err
    }

    // create noteBody
    try {
      if (_.isArray(note.body)) {
        await NoteBody.createMultipleNoteBodies(
          note.body,
          urlToId(createdNote.id),
          reader.id
        )
        createdNote.body = note.body
      } else {
        await NoteBody.createNoteBody(
          note.body,
          urlToId(createdNote.id),
          reader.id
        )
        createdNote.body = [note.body]
        debug('added single body: ', createdNote.body)
      }
    } catch (err) {
      debug('error: ', err.message)
      noteBodyError = err
    }

    if (noteBodyError) {
      // delete the note that was just created if the noteBody failed
      await Note.query(Note.knex())
        .where('id', '=', urlToId(createdNote.id))
        .del()
      throw noteBodyError
    }
    debug('created note to return: ', createdNote)
    return createdNote
  }

  static async copyToContext (
    noteId /*: string */,
    contextId /*: string */
  ) /*: Promise<any> */ {
    debug('**copyToContext**')
    debug('noteId: ', noteId, 'contextId: ', contextId)
    const originalNote = await Note.query()
      .findById(noteId)
      .withGraphFetched('[body, reader, tags]')
    if (!originalNote) throw new Error('no note')
    originalNote.contextId = contextId
    originalNote.original = urlToId(originalNote.id)
    originalNote.body = originalNote.body.map(body => {
      return {
        content: body.content,
        formattedContent: body.formattedContent,
        motivation: body.motivation,
        language: body.language
      }
    })

    const newNote = await Note.createNote(
      originalNote.reader,
      _.omit(originalNote, ['published', 'updated', 'id'])
    )
    debug('new note: ', newNote)
    return newNote
  }

  static async byId (id /*: string */) /*: Promise<any> */ {
    debug('**byId**')
    debug('id: ', id)
    const note = await Note.query()
      .findById(id)
      .withGraphFetched(
        '[reader, tags(notDeleted), body, relationsFrom.toNote(notDeleted).body, relationsTo.fromNote(notDeleted).body, notebooks, source(notDeleted, selectSource).attributions]'
      )
      .modifiers({
        notDeleted (builder) {
          builder.whereNull('deleted')
        },
        selectSource (builder) {
          builder.select('id', 'name', 'type', 'metadata')
        }
      })
      .whereNull('deleted')
      .whereNull('emptied')

    if (!note) return undefined

    if (note.relationsFrom || note.relationsTo) {
      note.relations = _.concat(note.relationsFrom, note.relationsTo)
      note.relationsFrom = null
      note.relationsTo = null
    }
    note.sourceId = null
    debug('note: ', note)
    return note
  }

  asRef () /*: string */ {
    debug('**asRef**')
    return this.id
  }

  static async delete (id /*: string */) /*: Promise<NoteType|null> */ {
    debug('**delete**')
    debug('id: ', id)
    // Delete all Note_Tag associated with the note
    const { Note_Tag } = require('./Note_Tag')
    await Note_Tag.deleteNoteTagsOfNote(id)

    await NoteBody.softDeleteBodiesOfNote(id)

    return await Note.query()
      .patchAndFetchById(id, { deleted: new Date().toISOString() })
      .whereNull('deleted')
  }

  static async empty (id /*: string */) /*: Promise<NoteType|null> */ {
    debug('**empty**')
    debug('id: ', id)

    return await Note.query()
      .patchAndFetchById(id, { emptied: new Date().toISOString() })
      .whereNull('deleted')
  }

  static async update (note /*: any */) /*: Promise<NoteType|null|Error> */ {
    // replace undefined to null for properties that can be deleted by the user
    debug('**update**')
    debug('incoming note: ', note)
    const propsCanBeDeleted = [
      'canonical',
      'stylesheet',
      'target',
      'previous',
      'document',
      'next',
      'parentId',
      'sourceId',
      'contextId',
      'json'
    ]
    propsCanBeDeleted.forEach(prop => {
      if (note[prop] === undefined) {
        note[prop] = null
      }
    })
    let modifications = await Note._formatIncomingNote(note)

    await NoteBody.deleteBodiesOfNote(urlToId(note.id))

    if (!note.body) {
      throw new Error(
        'Note Update Validation Error: body is a required property'
      )
    }

    let updatedNote = await Note.query()
      .updateAndFetchById(urlToId(note.id), modifications)
      .whereNull('deleted')
      .whereNull('emptied')
    debug('updated note: ', updatedNote)

    // if note not found:
    if (!updatedNote) return null

    // create NoteBody
    if (note.body) {
      if (_.isArray(note.body)) {
        for (const body of note.body) {
          await NoteBody.createNoteBody(
            body,
            urlToId(updatedNote.id),
            note.readerId
          )
        }
        updatedNote.body = note.body
        debug('added multiple bodies: ', updatedNote.body)
      } else {
        await NoteBody.createNoteBody(
          note.body,
          urlToId(updatedNote.id),
          note.readerId
        )
        updatedNote.body = [note.body]
        debug('added single body: ', updatedNote.body)
      }
    }
    debug('updated note after bodies: ', updatedNote)

    return updatedNote
  }

  $formatJson (json /*: any */) /*: any */ {
    json = super.$formatJson(json)
    json.type = 'Note'
    json.shortId = urlToId(json.id)

    json = _.omitBy(json, _.isNil)

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

module.exports = { Note }
