// @flow
'use strict'
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
    finished?: Date,
    publicationUrl?: string
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
        finished: { type: 'string', format: 'date-time' },
        publicationUrl: { type: 'string' }
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

  static async byId (id /*: string */) /*: Promise<any> */ {
    const job = await Job.query().findById(id)
    if (!job) return undefined

    if (job.error) {
      job.status = 500
    } else if (job.finished) {
      job.status = 302
    } else {
      job.status = 304
    }
    return job
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
    const modifications = _.pick(changes, [
      'finished',
      'error',
      'publicationId'
    ])
    // if error, should mark as finished too
    if (modifications.error && !modifications.finished) {
      modifications.finished = new Date().toISOString()
    }

    return await Job.query().patchAndFetchById(id, modifications)
  }
}

module.exports = { Job }
