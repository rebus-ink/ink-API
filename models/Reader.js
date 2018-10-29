const { BaseModel } = require('./BaseModel.js')
const { Model } = require('objection')
/**
 * @property {User} user - Returns the user (with auth info) associated with this reader.
 * @property {Document[]} documents - Returns the documents owned buy this Reader.
 * @property {Publication[]} publications - Returns the publications owned buy this Reader.
 *
 * The core user object for Rebus Reader. Models references to all of the objects belonging to the reader. Each reader should only be able to see the publications, documents and notes they have uploaded.
 */
class Reader extends BaseModel {
  static get tableName () {
    return 'Reader'
  }
  get path () {
    return 'reader'
  }
  static get jsonSchema () {
    return {
      type: 'object',
      title: 'User Profile',
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'string' },
        url: { type: 'string', format: 'url' },
        published: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
        json: {
          type: 'object',
          properties: {
            type: { const: 'Person' }
          },
          additionalProperties: true
        }
      },
      required: ['userId'],
      additionalProperties: true
    }
  }
  static get relationMappings () {
    const { Publication } = require('./Publication.js')
    const { Document } = require('./Document.js')
    return {
      publications: {
        relation: Model.HasManyRelation,
        modelClass: Publication,
        join: {
          from: 'Reader.id',
          to: 'Publication.readerId'
        }
      },
      documents: {
        relation: Model.HasManyRelation,
        modelClass: Document,
        join: {
          from: 'Reader.id',
          to: 'Document.readerId'
        }
      }
    }
  }
}

module.exports = { Reader }
