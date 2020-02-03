// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { ValidationError } = require('objection')

/*::
type ReadActivityType = {
  id: string,
  selector?: Object,
  json?: Object,
  readerId: string,
  publicationId: string,
  published: Date
};
*/

class ReadActivity extends BaseModel {
  static get tableName () /*: string */ {
    return 'readActivity'
  }

  get path () /*: string */ {
    return 'readActivity'
  }

  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        selector: { type: 'object' },
        json: { type: 'object' },
        readerId: { type: 'string' },
        publicationId: { type: 'string' },
        published: { type: 'string', format: 'date-time' }
      },
      required: ['readerId', 'publicationId', 'selector']
    }
  }

  static get relationMappings () /*: any */ {
    const { Publication } = require('./Publication.js')
    const { Reader } = require('./Reader.js')

    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'readActivity.readerId',
          to: 'Reader.id'
        }
      },
      publication: {
        relation: Model.BelongsToOneRelation,
        modelClass: Publication,
        join: {
          from: 'readActivity.publicationId',
          to: 'Publication.id'
        }
      }
    }
  }

  static async createReadActivity (
    readerId /*: string */,
    publicationId /*: string */,
    object /*: any */
  ) /*: Promise<any> */ {
    if (!publicationId) throw new Error('no publication')

    const props = _.pick(object, ['selector', 'json'])

    props.readerId = readerId
    props.publicationId = publicationId
    props.published = new Date().toISOString()
    try {
      return await ReadActivity.query()
        .insert(props)
        .returning('*')
    } catch (err) {
      if (err.constraint === 'readactivity_readerid_foreign') {
        throw 'no reader' // NOTE: should not happen. Should be caught by the post readActivity route
      } else if (err.constraint === 'readactivity_publicationid_foreign') {
        throw new Error('no publication') // keep this message... needed to differentiate 400 and 404 errors.
      } else if (err instanceof ValidationError) {
        throw err
      } else throw err
    }
  }

  static async getLatestReadActivity (
    publicationId /*: string */
  ) /*: Promise<ReadActivityType|Error> */ {
    if (!publicationId) return new Error('missing publicationId')

    const readActivities = await ReadActivity.query()
      .where('publicationId', '=', publicationId)
      .orderBy('published', 'desc')
      .limit(1)

    return readActivities[0]
  }
}

module.exports = { ReadActivity }
