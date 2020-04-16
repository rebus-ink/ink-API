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

  static _formatAttribution (
    attribution /*: any */,
    pubId /*: string */,
    readerId /*: string */,
    role /*: string */
  ) /*: any */ {
    let props
    if (_.isString(attribution)) {
      props = {
        name: attribution,
        type: 'Person',
        published: undefined,
        publicationId: pubId,
        readerId: readerId,
        normalizedName: undefined,
        role: role
      }
    } else {
      if (!attribution.type) attribution.type = 'Person'
      if (
        attribution.type !== 'Person' &&
        attribution.type !== 'Organization'
      ) {
        throw Error(
          `${role} attribution Validation Error: ${
            attribution.type
          } is not a valid type. Must be 'Person' or 'Organization'`
        )
      }
      if (!attribution.name) {
        throw Error(
          `${role} attribution Validation Error: name is a required property`
        )
      }

      props = _.pick(attribution, ['name', 'type', 'isContributor'])
      props.role = role
      props.readerId = readerId
      props.publicationId = pubId
    }

    props.normalizedName = this.normalizeName(props.name)

    return props
  }

  static async createSingleAttribution (
    role /*: string */,
    attribution /*: any */,
    pubId /*: string */,
    readerId /*: string */
  ) {
    if (!_.isString(attribution) && !_.isObject(attribution)) {
      throw new Error(
        `${role} attribution validation error: attribution should be either an attribution object or a string`
      )
    }
    if (_.isString(attribution)) {
      attribution = { type: 'Person', name: attribution }
    }
    let formattedAttribution = Attribution._formatAttribution(
      attribution,
      pubId,
      readerId,
      role
    )
    return await Attribution.query(Attribution.knex()).insert(
      formattedAttribution
    )
  }

  static async createAttributionsForPublication (
    publication /*: any */,
    pubId /*: string */,
    readerId /*: string */
  ) /*: any */ {
    let attributions = []
    let returnedAttributions = {}
    const attributionRoles = [
      'author',
      'editor',
      'contributor',
      'creator',
      'illustrator',
      'publisher',
      'translator',
      'copyrightHolder'
    ]
    attributionRoles.forEach(role => {
      if (publication[role]) {
        returnedAttributions[role] = []
        if (!_.isString(publication[role]) && !_.isObject(publication[role])) {
          throw new Error(
            `${role} attribution validation error: attribution should be either an attribution object or a string`
          )
        }
        if (_.isString(publication[role])) {
          publication[role] = [{ type: 'Person', name: publication[role] }]
        }
        publication[role].forEach(attribution => {
          let formatedAttribution = Attribution._formatAttribution(
            attribution,
            pubId,
            readerId,
            role
          )
          attributions.push(formatedAttribution)
          returnedAttributions[role].push({
            name: formatedAttribution.name,
            type: formatedAttribution.type
          })
        })
      }
    })

    await Attribution.query(Attribution.knex()).insert(attributions)
    return returnedAttributions
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
  static async deleteAttribution (
    publicationId /*: Array<string> */,
    role /*: string */,
    name /*: string */
  ) /*: Promise<number> */ {
    return await Attribution.query(Attribution.knex())
      .where('normalizedName', name)
      .andWhere('publicationId', '=', publicationId)
      .andWhere('role', '=', role)
      .del()
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
