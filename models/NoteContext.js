// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')

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
        published: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' }
      },
      required: ['type', 'readerId']
    }
  }
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')

    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'NoteRelation.readerId',
          to: 'Reader.id'
        }
      }
    }
  }

  static async createNoteContext (
    object /*: any */,
    readerId /*: string */
  ) /*: Promise<any> */ {
    const props = _.pick(object, ['type', 'name', 'description', 'json'])
    props.readerId = readerId

    return await NoteContext.query(NoteContext.knex()).insertAndFetch(props)
  }
}

module.exports = { NoteContext }
