// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')

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
    const { Activity } = require('./Activity.js')
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
      outbox: {
        relation: Model.HasManyRelation,
        modelClass: Activity,
        join: {
          from: 'Note.id',
          to: 'Activity.noteId'
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
      },
      tag: {
        relation: Model.HasManyRelation,
        modelClass: Tag,
        join: {
          from: 'Note.id',
          to: 'Tag.noteId'
        }
      }
    }
  }
}

module.exports = { Note }
