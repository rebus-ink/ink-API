// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { Note } = require('./Note')
const { urlToId } = require('../utils/utils')

/*::
type OutlineDataType = {
  id: string,
  noteId: string,
  previous: string,
  next: string,
  parentId: string
};
*/

class OutlineData extends BaseModel {
  static get tableName () /*: string */ {
    return 'OutlineData'
  }
  get path () /*: string */ {
    return 'outlineData'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        noteId: { type: 'string' },
        parentId: { type: ['string', 'null'] },
        previous: { type: ['string', 'null'] },
        next: { type: ['string', 'null'] },
        readerId: { type: 'string' },
        published: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' }
      },
      additionalProperties: true,
      required: ['noteId', 'readerId']
    }
  }
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'OutlineData.readerId',
          to: 'Reader.id'
        }
      },
      note: {
        relation: Model.BelongsToOneRelation,
        modelClass: Note,
        join: {
          from: 'OutlineData.noteId',
          to: 'Note.id'
        }
      }
    }
  }

  static async create (
    readerId /*: string */,
    object /*: any */
  ) /*: Promise<void> */ {
    // validate
    if (!object.noteId) throw new Error('no noteId')
    if (!readerId) throw new Error('no readerId')

    object.readerId = readerId

    await OutlineData.query().insert(object)
    // catch duplicate error
  }

  static async update (
    readerId /*: string */,
    object /*: any */
  ) /*: Promise<void> */ {
    // validate
    if (!object.noteId) throw new Error('no noteId')
    if (!readerId) throw new Error('no readerId')

    object.readerId = readerId
    try {
      await OutlineData.query()
        .patch(object)
        .where('noteId', '=', urlToId(object.noteId))
    } catch (err) {
      console.log('error!!!', err)
    }
  }

  static async delete (noteId /*: string */) /*: Promise<void> */ {
    if (!noteId) throw new Error('no noteId')

    await OutlineData.query()
      .patch({ deleted: new Date().toISOString() })
      .where('noteId', '=', noteId)
  }

  // static async deleteBodiesOfNote (noteId /*: string */) /*: Promise<number> */ {
  //   debug('**deleteBodiesOfNote**')
  //   debug('noteId: ', noteId)
  //   return await NoteBody.query(NoteBody.knex())
  //     .where('noteId', '=', noteId)
  //     .del()
  // }

  // static async softDeleteBodiesOfNote (
  //   noteId /*: string */
  // ) /*: Promise<void> */ {
  //   debug('**softDeleteBodiesOfNote**')
  //   debug('noteId: ', noteId)
  //   const date = new Date().toISOString()

  //   await NoteBody.query(NoteBody.knex())
  //     .where('noteId', '=', noteId)
  //     .patch({ deleted: date })
  // }
}

module.exports = { OutlineData }
