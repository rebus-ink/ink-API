// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')

/*::
type AttributionType = {
  id: string,
  role: string,
  isContributor: boolean,
  name: string,
  normalizedName: string,
  type: string,
  readerId: string,
  publicationId?: string,
  published: Date
};
*/

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
      required: ['role', 'name', 'normalizedName', 'readerId', 'publicationId']
    }
  }
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')
    const { Publication } = require('./Publication')
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
  ) /*: Promise<AttributionType> */ {
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
      if (!attribution.type) attribution.type = 'Person'
      if (
        attribution.type !== 'Person' &&
        attribution.type !== 'Organization'
      ) {
        throw Error('invalid attribution type')
      }
      if (!attribution.name) {
        throw Error('no attribution name')
      }

      props = _.pick(attribution, ['name', 'type', 'isContributor'])
      props.role = role
      props.readerId = publication.readerId
      props.publicationId = publication.id
    }

    props.normalizedName = this.normalizeName(props.name)

    return await Attribution.query(Attribution.knex()).insertAndFetch(props)
  }

  static normalizeName (name /*: string */) /*: string */ {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/\s/g, '') // remove spaces
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\']/g, '') // remove punctuation
  }

  static async byId (id /*: string */) /*: Promise<AttributionType> */ {
    return await Attribution.query().findById(id)
  }

  static async getAttributionByPubId (
    publicationId /*: string */
  ) /*: Promise<AttributionType> */ {
    if (publicationId === null) {
      throw Error(`Your publicationId cannot be null`)
    }

    return await Attribution.query(Attribution.knex()).where(
      'publicationId',
      '=',
      publicationId
    )
  }

  static async deleteAttributionOfPub (
    publicationId /*: string */,
    role /*: string */
  ) /*: Promise<number> */ {
    return await Attribution.query(Attribution.knex())
      .where('role', '=', role)
      .andWhere('publicationId', '=', publicationId)
      .del()
  }
}

module.exports = { Attribution }
