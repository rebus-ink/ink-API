// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')

/**
 * @property {Reader} reader - Returns the reader that owns this note. In most cases this should be 'actor' in the activity streams sense
 * @property {Document} document - returns the document, if any, that this note is on.
 * @property {Publication} context - Returns the note's parent `Publication`.
 *
 * todo: handle attributedTo and tags properly.
 *
 * This type covers all annotations on both Publications and Documents.
 *
 */
class Note extends BaseModel {
  static get tableName () {
    return 'Note'
  }
  get path () {
    return 'note'
  }
  static get jsonSchema () {
    return {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', maxLength: 255 },
        readerId: { type: 'string', format: 'uuid', maxLength: 255 },
        json: {
          type: 'object',
          properties: {
            type: { const: 'Note' }
          },
          additionalProperties: true
        },
        updated: { type: 'string', format: 'date-time' },
        published: { type: 'string', format: 'date-time' }
      },
      additionalProperties: true,
      required: ['json']
    }
  }
  static get relationMappings () {
    const { Publication } = require('./Publication.js')
    const { Reader } = require('./Reader.js')
    const { Document } = require('./Document.js')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Note.readerId',
          to: 'Reader.id'
        }
      },
      document: {
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
}

module.exports = { Note }
