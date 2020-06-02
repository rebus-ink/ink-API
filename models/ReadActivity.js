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
  sourceId: string,
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
        sourceId: { type: 'string' },
        published: { type: 'string', format: 'date-time' }
      },
      required: ['readerId', 'sourceId', 'selector']
    }
  }

  static get relationMappings () /*: any */ {
    const { Source } = require('./Source.js')
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
      source: {
        relation: Model.BelongsToOneRelation,
        modelClass: Source,
        join: {
          from: 'readActivity.sourceId',
          to: 'Source.id'
        }
      }
    }
  }

  static async createReadActivity (
    readerId /*: string */,
    sourceId /*: string */,
    object /*: any */
  ) /*: Promise<any> */ {
    if (!sourceId) throw new Error('no source')

    const props = _.pick(object, ['selector', 'json'])

    props.readerId = readerId
    props.sourceId = sourceId
    props.published = new Date().toISOString()
    try {
      return await ReadActivity.query()
        .insert(props)
        .returning('*')
    } catch (err) {
      if (err.constraint === 'readactivity_readerid_foreign') {
        throw 'no reader' // NOTE: should not happen. Should be caught by the post readActivity route
      } else if (err.constraint === 'readactivity_sourceid_foreign') {
        throw new Error('no source') // keep this message... needed to differentiate 400 and 404 errors.
      } else if (err instanceof ValidationError) {
        throw err
      } else throw err
    }
  }

  static async getLatestReadActivity (
    sourceId /*: string */
  ) /*: Promise<ReadActivityType|Error> */ {
    if (!sourceId) return new Error('missing sourceId')

    const readActivities = await ReadActivity.query()
      .where('sourceId', '=', sourceId)
      .orderBy('published', 'desc')
      .limit(1)

    return readActivities[0]
  }
}

module.exports = { ReadActivity }
