// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { Note } = require('./Note')

/*::
type NoteBodyType = {
  id: string,
  noteId: string,
  content: string,
  language: string,
  motivation: string,
  published: Date
};
*/

const motivations = [
  'test',
  'bookmarking',
  'commenting',
  'describing',
  'editing',
  'highlighting',
  'replying'
]

class NoteBody extends BaseModel {
  static get tableName () /*: string */ {
    return 'NoteBody'
  }
  get path () /*: string */ {
    return 'noteBody'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        noteId: { type: 'string' },
        content: { type: 'string' },
        language: { type: 'string' },
        motivation: { type: 'string' },
        readerId: { type: 'string' },
        published: { type: 'string', format: 'date-time' }
      },
      additionalProperties: true,
      required: ['noteId', 'motivation', 'readerId']
    }
  }
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'NoteBody.readerId',
          to: 'Reader.id'
        }
      },
      note: {
        relation: Model.BelongsToOneRelation,
        modelClass: Note,
        join: {
          from: 'NoteBody.noteId',
          to: 'Note.id'
        }
      }
    }
  }

  static async createNoteBody (
    noteBody /*: any */,
    noteId /*: string */,
    readerId /*: string */
  ) /*: Promise<NoteBodyType> */ {
    if (!noteBody) throw new Error('no noteBody')
    if (!noteId) throw new Error('no noteId')
    if (!noteBody.motivation) {
      throw new Error(
        'Note Validation Error: body.motivation is a required property'
      )
    }
    if (!readerId) throw new Error('no readerId')
    noteBody.motivation = noteBody.motivation.toLowerCase()
    if (motivations.indexOf(noteBody.motivation) === -1) {
      throw new Error(
        `Note Validation Error: ${
          noteBody.motivation
        } is not a valid value for body.motivation`
      )
    }

    let props = _.pick(noteBody, ['content', 'language', 'motivation'])
    props.noteId = noteId
    props.readerId = readerId
    return await NoteBody.query(NoteBody.knex()).insertAndFetch(props)
  }

  static async deleteBodiesOfNote (noteId /*: string */) /*: Promise<number> */ {
    return await NoteBody.query(NoteBody.knex())
      .where('noteId', '=', noteId)
      .del()
  }

  static async softDeleteBodiesOfNote (
    noteId /*: string */
  ) /*: Promise<void> */ {
    const date = new Date().toISOString()

    await NoteBody.query(NoteBody.knex())
      .where('noteId', '=', noteId)
      .patch({ deleted: date })
  }
}

module.exports = { NoteBody }
