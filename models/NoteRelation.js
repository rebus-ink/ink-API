// @flow
'use strict'
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { Model, ValidationError } = require('objection')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')

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
    props.id = `${urlToId(readerId)}-${crypto.randomBytes(5).toString('hex')}`

    let createdNoteRel
    try {
      createdNoteRel = await NoteRelation.query(
        NoteRelation.knex()
      ).insertAndFetch(props)
    } catch (err) {
      if (!(err instanceof ValidationError)) {
        if (err.constraint === 'noterelation_from_foreign') {
          throw new Error('no from')
        } else if (err.constraint === 'noterelation_to_foreign') {
          throw new Error('no to')
        } else if (err.constraint === 'noterelation_previous_foreign') {
          throw new Error('no previous')
        } else if (err.constraint === 'noterelation_next_foreign') {
          throw new Error('no next')
        }
      }

      throw err
    }
    return createdNoteRel
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

    let updatedRel
    try {
      updatedRel = await NoteRelation.query(NoteRelation.knex())
        .updateAndFetchById(relationId, props)
        .whereNull('deleted')
    } catch (err) {
      if (!(err instanceof ValidationError)) {
        if (err.constraint === 'noterelation_from_foreign') {
          throw new Error('no from')
        } else if (err.constraint === 'noterelation_to_foreign') {
          throw new Error('no to')
        } else if (err.constraint === 'noterelation_previous_foreign') {
          throw new Error('no previous')
        } else if (err.constraint === 'noterelation_next_foreign') {
          throw new Error('no next')
        }
      }

      throw err
    }

    return updatedRel
  }

  static async delete (id /*: string */) /*: Promise<any> */ {
    return await NoteRelation.query(NoteRelation.knex()).patchAndFetchById(id, {
      deleted: new Date().toISOString()
    })
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
