// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')

const statusMap = {
  pending: 1,
  accepted: 2,
  refused: 3,
  removed: 4,
  test: 99
}

class Collaborator extends BaseModel {
  static get tableName () /*: string */ {
    return 'Collaborator'
  }
  get path () /*: string */ {
    return 'collaborator'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        permission: { type: 'object' },
        readerId: { type: 'string' },
        notebookId: { type: 'string' },
        status: { type: 'number' },
        published: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
        deleted: { type: ['string', 'null'], format: 'date-time' }
      },
      required: ['readerId', 'notebookId', 'permission', 'status']
    }
  }

  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')

    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Collaborator.readerId',
          to: 'Reader.id'
        }
      }
    }
  }

  static _validateCollaborator (collaborator /*: any */) /*: any */ {
    if (!collaborator.status) {
      throw new Error(
        `Collaborator validation error: status is a required property`
      )
    }
    if (!statusMap[collaborator.status]) {
      throw new Error(
        `Collaborator validation error: ${
          collaborator.status
        } is not a valid status`
      )
    }
  }

  static _formatCollaborator (collaborator /*: any */) /*: any */ {
    collaborator.status = statusMap[collaborator.status]

    return collaborator
  }

  static async create (
    object /*: any */,
    notebookId /*: string */
  ) /*: Promise<any> */ {
    let props = _.pick(object, [
      'notebookId',
      'readerId',
      'permission',
      'status'
    ])
    props.notebookId = notebookId

    this._validateCollaborator(props)
    props = this._formatCollaborator(props)
    props.id = `${urlToId(props.readerId)}-${crypto
      .randomBytes(5)
      .toString('hex')}`

    let result
    try {
      result = await Collaborator.query().insertAndFetch(props)
    } catch (err) {
      if (err.constraint === 'collaborator_notebookid_foreign') {
        throw new Error(
          `Collaborator creation error: No Notebook found with id ${
            props.notebookId
          }`
        )
      } else if (err.constraint === 'collaborator_readerid_foreign') {
        throw new Error(
          `Collaborator creation error: No Reader found with id ${
            props.readerId
          }`
        )
      }
      throw err
    }
    return result
  }

  static async update (
    object /*: any */,
    notebookId /*: string */
  ) /*: Promise<any> */ {
    let props = _.pick(object, [
      'notebookId',
      'readerId',
      'permission',
      'status'
    ])
    props.notebookId = notebookId

    this._validateCollaborator(props)
    props = this._formatCollaborator(props)
    return await Collaborator.query()
      .updateAndFetchById(object.id, props)
      .whereNull('deleted')
  }

  static async delete (id /*: string */) /*: Promise<any> */ {
    const date = new Date().toISOString()
    return await Collaborator.query()
      .patchAndFetchById(id, { deleted: date })
      .whereNull('deleted')
  }

  $beforeInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeInsert(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.updated = doc.published
    })
  }

  $formatJson (json /*: any */) /*: any */ {
    json = super.$formatJson(json)
    json.shortId = urlToId(json.id)

    const statusString = _.findKey(statusMap, v => {
      return v === json.status
    })
    json.status = statusString

    json = _.omitBy(json, _.isNil)

    return json
  }
}

module.exports = { Collaborator }
