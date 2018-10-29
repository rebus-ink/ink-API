// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')

/**
 * @property {Reader} reader - Returns the reader that owns this publication.
 * @property {Document[]} attachment - Returns the documents attached to this publication.
 * @property {Note[]} replies - Returns the notes associated with this publication.
 *
 * This class represents an individual publication and holds references to the documents it contains, its creators/contributors, the notes on both the documents and publication itself, the reader who owns it, and the tags used to group it (and its contents) with other publications.
 */
class Publication extends BaseModel {
  static get tableName () {
    return 'Publication'
  }
  get path () {
    return 'publication'
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
            type: { const: 'reader:Publication' }
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
    const { Reader } = require('./Reader')
    const { Document } = require('./Document.js')
    const { Note } = require('./Note.js')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Publication.ownerId',
          to: 'Reader.id'
        }
      },
      replies: {
        relation: Model.HasManyRelation,
        modelClass: Note,
        join: {
          from: 'Publication.id',
          to: 'Note.publicationId'
        }
      },
      attachment: {
        relation: Model.HasManyRelation,
        modelClass: Document,
        join: {
          from: 'Publication.id',
          to: 'Document.publicationId'
        }
      }
    }
  }
}

module.exports = { Publication }
