// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { urlToId } = require('../routes/utils')
const urlparse = require('url').parse

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
        noteType: { type: 'string' },
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
      context: {
        relation: Model.BelongsToOneRelation,
        modelClass: Publication,
        join: {
          from: 'Note.publicationId',
          to: 'Publication.id'
        }
      }
    }
  }

  static async createNote (
    reader /*: any */,
    note /*: any */
  ) /*: Promise<any> */ {
    const { Document } = require('./Document')

    const props = _.pick(note, ['noteType', 'content', 'selector', 'json'])

    // $FlowFixMe
    const path = urlparse(note.inReplyTo).path.substr(45)
    props.selector = note['oa:hasSelector']
    const document = await Document.byPath(urlToId(note.context), path)
    props.documentId = urlToId(document.id)
    props.publicationId = note.context.id || note.context
    props.readerId = reader.id

    return await Note.query().insertAndFetch(props)
  }

  static async byId (id /*: string */) /*: Promise<any> */ {
    const { Document } = require('./Document')

    const note = await Note.query()
      .findById(id)
      .eager('reader')
    if (!note) return undefined

    const document = await Document.byId(urlToId(note.documentId))
    // $FlowFixMe
    note.inReplyTo = `${process.env.DOMAIN}/${note.publicationId}${
      document.documentPath
    }`
    note.context = note.publicationId
    return note
  }

  asRef () /*: string */ {
    return this.id
  }

  static async delete (id /*: string */) /*: Promise<any> */ {
    let note = await Note.query().findById(id)
    if (!note || note.deleted) return null
    note.deleted = new Date().toISOString()
    return await Note.query().updateAndFetchById(id, note)
  }

  static async update (object /*: any */) /*: Promise<any> */ {
    // $FlowFixMe
    object.selector = object['oa:hasSelector']
    const modifications = _.pick(object, ['content', 'selector'])
    let note = await Note.query().findById(urlToId(object.id))
    if (!note) {
      return null
    }
    note = Object.assign(note, modifications)
    return await Note.query().updateAndFetchById(urlToId(object.id), note)
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
