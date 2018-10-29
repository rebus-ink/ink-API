// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')

/**
 * @property {Reader} reader - Returns the reader that owns this publication.
 *
 * This class represents an individual publication and holds references to the documents it contains, its creators/contributors, the notes on both the documents and publication itself, the reader who owns it, and the tags used to group it (and its contents) with other publications.
 */
class Publication extends BaseModel {
  static get tableName () {
    return 'Publication'
  }
  static get path () {
    return 'publication'
  }
  static get jsonSchema () {
    return {
      type: 'object',
      properties: {
        canonicalId: { anyOf: [{ type: 'string', format: 'url' }, null] },
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
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Publication.ownerId',
          to: 'Reader.id'
        }
      }
    }
  }
}

module.exports = { Publication }
