// @flow
'use strict'
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
  sourceId?: string,
  published: Date
};
*/

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
        name: { type: 'string' },
        normalizedName: { type: 'string' },
        type: { type: 'string' },
        readerId: { type: 'string' },
        isContributor: { type: 'boolean' },
        sourceId: { type: 'string' },
        published: { type: 'string' }
      },
      required: ['role', 'name', 'normalizedName', 'readerId', 'sourceId']
    }
  }

  static _formatAttribution (
    attribution /*: any */,
    sourceId /*: string */,
    readerId /*: string */,
    role /*: string */
  ) /*: any */ {
    let props
    if (_.isString(attribution)) {
      props = {
        name: attribution,
        type: 'Person',
        published: undefined,
        sourceId: sourceId,
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
      props.sourceId = sourceId
    }

    props.normalizedName = this.normalizeName(props.name)
    return props
  }

  static async createSingleAttribution (
    role /*: string */,
    attribution /*: any */,
    sourceId /*: string */,
    readerId /*: string */
  ) /*: any */ {
    if (!_.isString(attribution) && !_.isObject(attribution)) {
      throw new Error(
        `${role} attribution validation error: attribution should be either an attribution object or a string`
      )
    }
    let formattedAttribution = Attribution._formatAttribution(
      attribution,
      sourceId,
      readerId,
      role
    )
    return await Attribution.query(Attribution.knex()).insert(
      formattedAttribution
    )
  }

  static async createAttributionsForSource (
    source /*: any */,
    sourceId /*: string */,
    readerId /*: string */
  ) /*: any */ {
    let attributions = []
    let returnedAttributions = {}

    attributionRoles.forEach(role => {
      if (source[role]) {
        returnedAttributions[role] = []
        if (!_.isString(source[role]) && !_.isObject(source[role])) {
          throw new Error(
            `${role} attribution validation error: attribution should be either an attribution object or a string`
          )
        }
        if (_.isString(source[role])) {
          source[role] = [{ type: 'Person', name: source[role] }]
        }
        source[role].forEach(attribution => {
          let formatedAttribution = Attribution._formatAttribution(
            attribution,
            sourceId,
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

    if (attributions.length) {
      await Attribution.query().insert(attributions)
    }
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

  static async getAttributionBySourceId (
    sourceId /*: string */
  ) /*: Promise<AttributionType> */ {
    if (sourceId === null) {
      throw Error(`Your sourceId cannot be null`)
    }

    return await Attribution.query(Attribution.knex()).where(
      'sourceId',
      '=',
      sourceId
    )
  }
  static async deleteAttribution (
    sourceId /*: Array<string> */,
    role /*: string */,
    name /*: string */
  ) /*: Promise<number> */ {
    return await Attribution.query(Attribution.knex())
      .where('normalizedName', name)
      .andWhere('sourceId', '=', sourceId)
      .andWhere('role', '=', role)
      .del()
  }

  static async deleteAttributionOfSource (
    sourceId /*: string */,
    role /*: string */
  ) /*: Promise<number> */ {
    return await Attribution.query(Attribution.knex())
      .where('role', '=', role)
      .andWhere('sourceId', '=', sourceId)
      .del()
  }

  $beforeUpdate (queryOptions /*: any */, context /*: any */) /*:any */ {
    const parent = super.$beforeUpdate(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.updated = undefined

      Object.keys(doc).forEach(
        key => (doc[key] === undefined ? delete doc[key] : '')
      )
    })
  }
}

module.exports = { Attribution }
