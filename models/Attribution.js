// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { Publication } = require('./Publication')
const { urlToId } = require('../routes/utils')

// TODO: add more valid roles
const attributionRoles = ['author', 'editor']

/**
 * @property {Publication} publicationId - returns the `Publication` the attributions belong to.
 */
class Attribution extends BaseModel {
  static get tableName () /*: string */ {
    return 'Attribution'
  }
  get path () /*: string */ {
    return 'attribution'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        role: { type: 'string' },
        name: { type: 'string ' },
        normalizedName: { type: 'string' },
        type: { type: 'string' },
        readerId: { type: 'string' },
        isContributor: { type: 'boolean' },
        publicationId: { type: 'string' },
        published: { type: 'string', format: 'date-time' }
      },
      additionalProperties: true,
      required: [
        'role',
        'name',
        'normalizedName',
        'readerId',
        'publicationId',
        'published'
      ]
    }
  }
  static get relationMappings () /*: any */ {
    const { Publication } = require('./Publication.js')
    const { Reader } = require('./Reader')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Attribution.readerId',
          to: 'Reader.id'
        }
      },
      publication: {
        relation: Model.BelongsToOneRelation,
        modelClass: Publication,
        join: {
          from: 'Attribution.publicationId',
          to: 'Publication.id'
        }
      }
    }
  }

  /*
  Note: attribution parameter can be either a string (the name of the person) or an object with name, type and isContributor properties (isContributor is optional. Defaults to false)
  If the attribution is a string, type defaults to 'Person'
  If attribution is an object, type can be either 'Person' or 'Organization'
  */
  static async createAttribution (
    attribution /*: any */,
    role /*: string */,
    publication /*: any */
  ) {
    if (_.indexOf(attributionRoles, role.toLowerCase()) === -1) {
      throw Error(`${role} is not a valid attribution role`)
    }

    let props

    if (_.isString(attribution)) {
      props = {
        name: attribution,
        type: 'Person',
        published: undefined,
        publicationId: publication.id,
        readerId: publication.readerId,
        normalizedName: undefined,
        role: role
      }
    } else {
      if (
        attribution.type !== 'Person' &&
        attribution.type !== 'Organization'
      ) {
        throw Error(
          `${
            attribution.type
          } is not a valid attribution type. Only 'Person' and 'Organization' are accepted.`
        )
      }
      props = _.pick(attribution, ['name', 'type', 'isContributor'])
      props.role = role
      props.readerId = publication.readerId
      props.publicationId = publication.id
    }

    const time = new Date().toISOString()
    props.normalizedName = props.name.toLowerCase() // todo: remove accents, etc.
    props.published = time

    return await Attribution.query(Attribution.knex()).insertAndFetch(props)
  }

  static async byId (id /*: string */) /*: Promise<any> */ {
    return await Attribution.query().findById(id)
  }

  // TODO: delete by publicationIdb

  static async getAttributionByPubId (publicationId /*: string */) /*: any */ {
    if (publicationId == null) {
      throw Error(`Your publicationId cannot be null`)
    }

    // return Attribution.query().where(publicationId)
    return Attribution.query().where('publicationId', publicationId)
  }

  static async deleteAttributionOfPub (
    publicationId /*: string */,
    role /*: string */
  ) /*: any */ {
    if (_.indexOf(attributionRoles, role.toLowerCase()) === -1) {
      throw Error(`${role} is not a valid attribution role`)
    }

    const numDeleted = await Attribution.query(Attribution.knex())
      .where('role', '=', role)
      .andWhere('publicationId', '=', publicationId)
      .del()

    return numDeleted
  }
}

module.exports = { Attribution }
