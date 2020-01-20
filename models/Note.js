// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')
const urlparse = require('url').parse
const { NoteBody } = require('./NoteBody')

/*::
type NoteType = {
  id?: string,
  readerId: string,
  canonical?: string,
  stylesheet?: Object,
  target? : Object,
  body?: Object,
  json?: Object,
  documentUrl?: string,
  publicationId?: string,
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
        canonical: { type: 'string' },
        stylesheet: { type: 'object' },
        target: { type: 'object' },
        publicationId: { type: 'string' },
        documentId: { type: 'string' },
        documentUrl: { type: 'string' },
        body: { type: 'object' },
        json: { type: 'object' },
        updated: { type: 'string', format: 'date-time' },
        published: { type: 'string', format: 'date-time' },
        deleted: { type: 'string', format: 'date-time' }
      },
      additionalProperties: true,
      required: ['readerId']
    }
  }

  static get relationMappings () /*: any */ {
    const { Publication } = require('./Publication.js')
    const { Document } = require('./Document.js')
    const { Reader } = require('./Reader.js')
    const { Tag } = require('./Tag.js')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Note.readerId',
          to: 'Reader.id'
        }
      },
      inReplyTo: {
        relation: Model.BelongsToOneRelation,
        modelClass: Document,
        join: {
          from: 'Note.documentId',
          to: 'Document.id'
        }
      },
      publication: {
        relation: Model.BelongsToOneRelation,
        modelClass: Publication,
        join: {
          from: 'Note.publicationId',
          to: 'Publication.id'
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
      }
    }
  }

  static async _formatIncomingNote (
    note /*: NoteType */
  ) /*: Promise<NoteType> */ {
    const { Document } = require('./Document')
    const props = _.pick(note, [
      'canonical',
      'stylesheet',
      'target',
      'publicationId',
      'json',
      'readerId',
      'documentUrl'
    ])
    if (note.id) props.id = urlToId(note.id)

    if (note.documentUrl) {
      // first, make sure we also have a publicationId
      if (!note.publicationId) {
        throw new Error('document without publication')
      }

      // $FlowFixMe
      const path = urlparse(note.documentUrl).path // '/publications/{pubid}/path/to/file'
      // $FlowFixMe
      const startIndex = path.split('/', 3).join('/').length // index of / before path/to/file
      // $FlowFixMe
      const docPath = path.substring(startIndex + 1) // 'path/to/file'
      // $FlowFixMe
      const publicationId = path.substring(14, startIndex) // {pubid}
      const document = await Document.byPath(publicationId, docPath)

      if (document) {
        if (urlToId(document.publicationId) !== urlToId(note.publicationId)) {
          throw new Error('document and publication do not match')
        }

        props.documentId = urlToId(document.id)
      } else {
        const err = new Error('no document')
        // $FlowFixMe
        err.note = note
        throw new Error('no document')
      }
    }
    return props
  }
  static async createNote (
    reader /*: any */,
    note /*: any */
  ) /*: Promise<NoteType|Error> */ {
    let props
    try {
      props = await Note._formatIncomingNote(note)
    } catch (err) {
      return err
    }
    props.readerId = reader.id
    props.id = `${urlToId(reader.id)}-${crypto.randomBytes(5).toString('hex')}`

    let createdNote
    let noteBodyError

    if (!note.body) {
      noteBodyError = new Error('no body')
    }

    try {
      createdNote = await Note.query().insertAndFetch(props)
    } catch (err) {
      if (err.constraint === 'note_publicationid_foreign') {
        return new Error('no publication')
      }
      return err
    }

    // create noteBody
    try {
      if (_.isArray(note.body)) {
        for (const body of note.body) {
          await NoteBody.createNoteBody(
            body,
            urlToId(createdNote.id),
            reader.id
          )
        }
      } else {
        await NoteBody.createNoteBody(
          note.body,
          urlToId(createdNote.id),
          reader.id
        )
      }
      createdNote.body = note.body
    } catch (err) {
      noteBodyError = err
    }

    if (noteBodyError) {
      // delete the note that was just created if the noteBody failed
      await Note.query(Note.knex())
        .where('id', '=', urlToId(createdNote.id))
        .del()
      return noteBodyError
    }
    return createdNote
  }

  static async byId (id /*: string */) /*: Promise<any> */ {
    const note = await Note.query()
      .findById(id)
      .eager('[reader, tags, body]')

    if (!note) return undefined

    return note
  }

  asRef () /*: string */ {
    return this.id
  }

  static async delete (id /*: string */) /*: Promise<NoteType|null> */ {
    let note = await Note.query().findById(id)
    if (!note || note.deleted) return null

    // Delete all Note_Tag associated with the note
    const { Note_Tag } = require('./Note_Tag')
    await Note_Tag.deleteNoteTagsOfNote(id)

    await NoteBody.softDeleteBodiesOfNote(id)

    note.deleted = new Date().toISOString()
    return await Note.query().updateAndFetchById(id, note)
  }

  static async update (note /*: any */) /*: Promise<NoteType|null> */ {
    const modifications = await Note._formatIncomingNote(note)
    await NoteBody.deleteBodiesOfNote(urlToId(note.id))

    let updatedNote
    try {
      updatedNote = await Note.query().updateAndFetchById(
        urlToId(note.id),
        modifications
      )
    } catch (err) {
      return err
    }

    // if note not found:
    if (!updatedNote) return null

    // create NoteBody
    if (note.body) {
      try {
        if (_.isArray(note.body)) {
          for (const body of note.body) {
            await NoteBody.createNoteBody(
              body,
              urlToId(updatedNote.id),
              note.readerId
            )
          }
        } else {
          await NoteBody.createNoteBody(
            note.body,
            urlToId(updatedNote.id),
            note.readerId
          )
        }
        updatedNote.body = note.body
      } catch (err) {
        throw err
      }
    }

    return updatedNote
  }

  $formatJson (json /*: any */) /*: any */ {
    json = super.$formatJson(json)
    json.type = 'Note'
    if (json.body && json.body.length === 1) {
      json.body = json.body[0]
    }
    if (json.body && json.body.length === 0) {
      json.body = undefined
    }
    if (json.documentId) json.documentId = undefined

    json = _.omitBy(json, _.isNil)

    return json
  }

  $beforeInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeInsert(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.updated = new Date().toISOString()
    })
  }
}

module.exports = { Note }
