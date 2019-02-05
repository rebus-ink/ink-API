// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const short = require('short-uuid')
const translator = short()

/**
 * @property {Document} document - returns the document, if any, that this tag is a property of.
 * @property {Publication} publication - returns the publication, if any, that this tag is a property of.
 * @property {Note} note - returns the note, if any, that this tag is a property of.
 * @property {Reader} reader - returns the owning reader.
 *
 * This is a slightly generic link model. Conceptually, this is a link from the document or publication to a URL. These links can have types such as as:HashTag, reader:Stack, or Mention. (Mentions are used to list out characters and people who are mentioned in the text.)
 *
 */
class Tag extends BaseModel {
  static get tableName () /*: string */ {
    return 'Tag'
  }
  get path () /*: string */ {
    return 'tag'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        canonicalId: { type: ['string', 'null'], format: 'url' },
        id: { type: 'string', format: 'uuid', maxLength: 255 },
        readerId: { type: 'string', format: 'uuid', maxLength: 255 },
        json: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            name: { type: 'string' }
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
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')
    const { Activity } = require('./Activity')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Tag.readerId',
          to: 'Reader.id'
        }
      },
      activity: {
        relation: Model.BelongsToOneRelation,
        modelClass: Activity,
        join: {
          from: 'Tag.activityId',
          to: 'Activity.id'
        }
      }
    }
  }

  static async byShortId (
    shortId /*: string */
  ) /*: Promise<{
    id: string,
    type: string,
    json: {type: string, name: string},
    readerId: string,
    published: string,
    updated: string
  }> */ {
    return Tag.query().findById(translator.toUUID(shortId))
  }
}

module.exports = { Tag }
