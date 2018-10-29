// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')

/**
 * @property {Document} document - returns the document, if any, that this Person has contributed to.
 * @property {Publication} publication - returns the publication, if any, that this Person has contributed to.
 * @property {canonicalId} string - returns the canonical url id for the attribution.
 *
 * This type models all of the creators and contributors that a publication can have.
 *
 * Because of how messy contributor and creator metadata tends to be, these are structured to be specific to the publication (and possibly document) they are found in. To find all publications by an author you need to query for all Attribution objects with the 'name' criteria you have in mind and use eager queries to get the publications and documents that are attributed to them.console. (To speed this up in the future we'll have to add an index for the JSON in Postgresql. [Example from the Objection documentation site.](https://vincit.github.io/objection.js/#indexing-postgresql-jsonb-columns))
 *
 * You should then further group those results based on whichever additional metadata you have such as ORCID and other specific IDs, which would be found as a secondary Link object in the `url` property of the original Activity Streams JSON object using one of the `author`, `DCTERMS.creator`, or `DCTERMS.contributor` rel values.
 *
 * That url is surfaced in the model as `canonicalId` which should be an ORCID, if available.
 *
 * The `role` property is derived from `schema:` metadata properties on the publication JSON file itself.
 */
class Attribution extends BaseModel {
  static get tableName () {
    return 'Attribution'
  }
  get path () {
    return 'attribution'
  }
  static get jsonSchema () {
    return {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', maxLength: 255 },
        readerId: { type: 'string', format: 'uuid', maxLength: 255 },
        canonicalId: { type: 'string', format: 'url' },
        isContributor: { type: 'boolean' },
        role: { type: 'string' },
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
  static get relationMappings () {
    const { Publication } = require('./Publication.js')
    const { Document } = require('./Document.js')
    const { Reader } = require('./Reader')
    return {
      document: {
        relation: Model.BelongsToOneRelation,
        modelClass: Document,
        join: {
          from: 'Attribution.documentId',
          to: 'Document.id'
        }
      },
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
}

module.exports = { Attribution }
