// @flow
'use strict'
const { BaseModel } = require('./BaseModel.js')
const Model = require('objection').Model
const { Reader } = require('./Reader')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')

/*::
type JobType = {
    id: string,
    type: string,
    readerId: string,
    publicationId?: string,
    error?: string,
    published: Date,
    finished?: Date
  }
*/

class Job extends Model {
  static get tableName () /*: string */ {
    return 'job'
  }
  get path () /*: string */ {
    return 'job'
  }

  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string', maxLength: 255 },
        publicationId: { type: 'string' },
        readerId: { type: 'string' },
        error: { type: 'string' },
        published: { type: 'string', format: 'date-time' },
        finished: { type: 'string', format: 'date-time' }
      },
      required: ['type', 'readerId']
    }
  }

  static get relationMappings () /*: any */ {
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Job.readerId',
          to: 'Reader.id'
        }
      }
    }
  }

  static async getStatusById (
    id /*: string */
  ) /*: Promise<{status: number, message?: string}> */ {
    const job = await Job.query().findById(id)

    if (job.error) {
      return { status: 500, message: job.error }
    } else if (job.finished) {
      return { status: 201 }
    } else {
      return { status: 304 }
    }
  }

  static async createJob (
    job /*: { type: string, readerId: string, publicationId: string } */
  ) /*: Promise<JobType> */ {
    const props = _.pick(job, ['type', 'readerId', 'publicationId'])

    props.readerId = urlToId(props.readerId)
    props.publicationId = urlToId(props.publicationId)

    return await Job.query()
      .insert(props)
      .returning('*')
  }

  static async updateJob (
    id /*: string */,
    changes /*: any */
  ) /*: Promise<JobType> */ {
    const modifications = _.pick(changes, ['finished', 'error'])

    // if error, should mark as finished too
    if (modifications.error && !modifications.finished) {
      modifications.finished = new Date().toISOString()
    }

    return await Job.query().patchAndFetchById(id, modifications)
  }
}

module.exports = { Job }
