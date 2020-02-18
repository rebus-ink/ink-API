// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')

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
    props.id = `${urlToId(readerId)}-${crypto.randomBytes(5).toString('hex')}`

    return await NoteContext.query(NoteContext.knex()).insertAndFetch(props)
  }

  static async update (object /*: any */) /*: Promise<any> */ {
    const props = _.pick(object, [
      'readerId',
      'type',
      'name',
      'description',
      'json'
    ])

    return await NoteContext.query(NoteContext.knex()).updateAndFetchById(
      object.id,
      props
    )
  }
}

module.exports = { NoteContext }
