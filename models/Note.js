// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')
const urlparse = require('url').parse
const route = require('path-match')({
  sensitive: false,
  strict: false,
  end: false
})
const match = route('/publication-:context/:path*')

/*::
type NoteType = {
  id: string,
  noteType: string,
  content?: string,
  selector?: Object,
  json?: Object,
  readerId: string,
  documentId?: string,
  publicationId?: string,
  published: Date,
  updated: Date
};
*/

/**
 * @property {Reader} reader - Returns the reader that owns this note. In most cases this should be 'actor' in the activity streams sense
 * @property {Document} inReplyTo - returns the document, if any, that this note is on.
 * @property {Publication} context - Returns the note's parent `Publication`.
 * @property {Activity[]} outbox - Returns the activities on this note. **Question** how should a note reference its activities?
 * @property {Tag[]} tag - Returns the note's `Tag` objects (i.e. links, hashtags, stacks and categories).
 *
 * todo: handle attributedTo and tags properly.
 *
 * This type covers all annotations on both Publications and Documents.
 *
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
        noteType: { type: 'string', maxLength: 255 },
        content: { type: 'string' },
        selector: { type: 'object' },
        json: { type: 'object' },
        readerId: { type: 'string' },
        documentId: { type: 'string' },
        publicationId: { type: 'string' },
        updated: { type: 'string', format: 'date-time' },
        published: { type: 'string', format: 'date-time' },
        deleted: { type: 'string', format: 'date-time' }
      },
      additionalProperties: true,
      required: ['noteType', 'readerId']
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

  static async createNote (
    reader /*: any */,
    note /*: any */
  ) /*: Promise<NoteType> */ {
    const { Document } = require('./Document')
    const props = _.pick(note, ['noteType', 'content', 'selector', 'json'])

    if (note.inReplyTo) {
      // $FlowFixMe
      const path = urlparse(note.inReplyTo).path // '/publications/{pubid}/path/to/file'
      // $FlowFixMe
      const startIndex = path.split('/', 3).join('/').length // index of / before path/to/file
      // $FlowFixMe
      const docPath = path.substring(startIndex + 1) // 'path/to/file'
      // $FlowFixMe
      const publicationId = path.substring(14, startIndex) // {pubid}
      const document = await Document.byPath(publicationId, docPath)

      if (document) {
        props.documentId = urlToId(document.id)
      } else {
        const err = new Error('no document')
        // $FlowFixMe
        err.note = note
        throw new Error('no document')
      }
    }
    props.selector = note['oa:hasSelector']

    if (note.context) {
      props.publicationId = note.context
    }
    props.readerId = reader.id
    props.id = `${urlToId(reader.id)}-${crypto.randomBytes(5).toString('hex')}`

    try {
      return await Note.query().insertAndFetch(props)
    } catch (err) {
      if (err.constraint === 'note_publicationid_foreign') {
        throw new Error('no publication')
      }
      throw err
    }
  }

  static async byId (id /*: string */) /*: Promise<any> */ {
    const { Document } = require('./Document')

    const note = await Note.query()
      .findById(id)
      .eager('[reader, tags]')

    if (!note) return undefined

    if (note.documentId) {
      const document = await Document.byId(urlToId(note.documentId))
      // $FlowFixMe
      note.inReplyTo = `${process.env.DOMAIN}/${note.publicationId}${
        document.documentPath
      }`
    }

    note.context = note.publicationId

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

    note.deleted = new Date().toISOString()
    return await Note.query().updateAndFetchById(id, note)
  }

  static async update (object /*: any */) /*: Promise<NoteType|null> */ {
    // $FlowFixMe
    if (object['oa:hasSelector']) object.selector = object['oa:hasSelector']

    const modifications = _.pick(object, ['content', 'selector', 'json'])
    let note = await Note.query().findById(urlToId(object.id))
    if (!note) {
      return null
    }
    // note = Object.assign(note, modifications)
    try {
      return await Note.query().patchAndFetchById(
        urlToId(object.id),
        modifications
      )
    } catch (err) {
      return err
    }
  }

  $formatJson (json /*: any */) /*: any */ {
    json = super.$formatJson(json)
    json.type = 'Note'
    json['oa:hasSelector'] = json.selector
    json.context = json.publicationId
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
