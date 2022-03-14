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
        to: { type: 'string' },
        type: { type: 'string' },
        json: { type: ['object', 'null'] },
        readerId: { type: 'string' },
        published: { type: 'string' },
        updated: { type: 'string' }
      },
      required: ['from', 'to', 'type', 'readerId']
    }
  }
  static get relationMappings () /*: any */ {
    const { Note } = require('./Note')
    return {
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
    const props = _.pick(object, ['from', 'to', 'type', 'json'])
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
}

module.exports = { NoteRelation }
