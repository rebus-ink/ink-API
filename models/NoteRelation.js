// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')

class NoteRelation extends BaseModel {
  static get tableName () /*: string */ {
    return 'NoteRelation'
  }
  get path () /*: string */ {
    return 'noteRelation'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        from: { type: 'string' },
        to: { type: ['string', 'null'] },
        type: { type: 'string' },
        previous: { type: ['string', 'null'] },
        next: { type: ['string', 'null'] },
        contextId: { type: ['string', 'null'] },
        json: { type: ['object', 'null'] },
        readerId: { type: 'string' },
        published: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' }
      },
      required: ['from', 'type', 'readerId']
    }
  }
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')
    const { Publication } = require('./Publication')
    const { Note } = require('./Note')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'NoteRelation.readerId',
          to: 'Reader.id'
        }
      },
      // context: {
      //   relation: Model.BelongsToOneRelation,
      //   modelClass: NoteRelationContext,
      //   join: {
      //     from: 'NoteRelation.contextId',
      //     to: 'NoteRelationContext.id'
      //   }
      // },
      toNote: {
        relation: Model.BelongsToOneRelation,
        modelClass: Note,
        join: {
          from: 'NoteRelation.to',
          to: 'Note.id'
        }
      },
      fromNote: {
        relation: Model.BelongsToOneRelation,
        modelClass: Note,
        join: {
          from: 'NoteRelation.from',
          to: 'Note.id'
        }
      }
    }
  }

  static async createNoteRelation (
    object /*: any */,
    readerId /*: string */
  ) /*: Promise<any> */ {
    const props = _.pick(object, [
      'from',
      'to',
      'type',
      'previous',
      'next',
      'contextId',
      'json'
    ])
    props.readerId = readerId

    return await NoteRelation.query(NoteRelation.knex()).insertAndFetch(props)
  }

  static async updateNoteRelation (object /*: any */) /*: Promise<any> */ {
    const relationId = object.id
    const props = _.pick(object, [
      'from',
      'to',
      'type',
      'readerId',
      'previous',
      'next',
      'contextId',
      'json'
    ])

    return await NoteRelation.query(NoteRelation.knex()).updateAndFetchById(
      relationId,
      props
    )
  }

  static async getRelationsForNote (
    noteId /*: string */
  ) /*: Promise<Array<any>> */ {
    return await NoteRelation.query(NoteRelation.knex())
      .where('to', noteId)
      .orWhere('from', noteId)
  }

  static async getRelationsForContext (
    contextId /*: string */
  ) /*: Promise<Array<any>> */ {
    return await NoteRelation.query(NoteRelation.knex()).where(
      'contextId',
      contextId
    )
  }
}

module.exports = { NoteRelation }
