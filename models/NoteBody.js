// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { Note } = require('./Note')
const debug = require('debug')('ink:models:NoteBody')
const striptags = require('striptags')

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
        content: { type: ['string', 'null'] },
        formattedContent: { type: ['string', 'null'] },
        language: { type: ['string', 'null'] },
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

  static async createMultipleNoteBodies (
    noteBodies /*: any */,
    noteId /*: string */,
    readerId /*: string */
  ) /*: Promise<void> */ {
    debug('**createMultipleNoteBodies**')
    debug('noteBodies: ', noteBodies)
    debug('noteId: ', noteId)
    debug('readerId: ', readerId)
    // validate
    if (!noteBodies || !noteBodies[0]) throw new Error('no noteBody')
    if (!noteId) throw new Error('no noteId')
    if (!readerId) throw new Error('no readerId')

    noteBodies.forEach(body => {
      if (!body.motivation) {
        throw new Error(
          'Note Validation Error: body.motivation is a required property'
        )
      }
      if (motivations.indexOf(body.motivation.toLowerCase()) === -1) {
        throw new Error(
          `Note Validation Error: ${
            body.motivation
          } is not a valid value for body.motivation`
        )
      }
    })

    let bodies = noteBodies.map(body => {
      let props = _.pick(body, ['content', 'language', 'motivation'])
      props.motivation = props.motivation.toLowerCase()
      props.noteId = noteId
      props.readerId = readerId
      props.formattedContent = striptags(props.content)
      return props
    })
    debug('bodies to be inserted: ', bodies)

    await NoteBody.query(NoteBody.knex()).insert(bodies)
  }

  static async createNoteBody (
    noteBody /*: any */,
    noteId /*: string */,
    readerId /*: string */
  ) /*: Promise<void> */ {
    debug('**createNoteBody**')
    debug('noteBody: ', noteBody)
    debug('noteId: ', noteId, 'readerId: ', readerId)

    return await NoteBody.createMultipleNoteBodies([noteBody], noteId, readerId)
  }

  static async deleteBodiesOfNote (noteId /*: string */) /*: Promise<number> */ {
    debug('**deleteBodiesOfNote**')
    debug('noteId: ', noteId)
    return await NoteBody.query(NoteBody.knex())
      .where('noteId', '=', noteId)
      .del()
  }

  static async softDeleteBodiesOfNote (
    noteId /*: string */
  ) /*: Promise<void> */ {
    debug('**softDeleteBodiesOfNote**')
    debug('noteId: ', noteId)
    const date = new Date().toISOString()

    await NoteBody.query(NoteBody.knex())
      .where('noteId', '=', noteId)
      .patch({ deleted: date })
  }
}

module.exports = { NoteBody }
