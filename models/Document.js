// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const { Publication } = require('./Publication.js')
const { Note } = require('./Note')
const { Reader } = require('./Reader.js')
const _ = require('lodash')

/**
 * @property {Reader} reader - Returns the reader that owns this document.
 * @property {Publication} context - Returns the document's parent `Publication`.
 * @property {Note[]} replies - Returns the notes associated with this document.
 *
 * This model covers Images, Pages (HTML, plain text, markdown), Articles, Audio, and Video resources that can be included in a publication and uploaded by a reader
 */
class Document extends BaseModel {
  static get tableName () /*: string */ {
    return 'Document'
  }
  get path () /*: string */ {
    return 'document'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        mediaType: { type: 'string' },
        url: { type: 'string' },
        documentPath: { type: 'string' },
        readerId: { type: 'string' },
        publicationId: { type: 'string' },
        json: { type: 'object' },
        updated: { type: 'string', format: 'date-time' },
        published: { type: 'string', format: 'date-time' },
        deleted: { type: 'string', format: 'date-time' }
      },
      additionalProperties: true,
      required: ['url', 'documentPath', 'readerId', 'publicationId']
    }
  }
  static get relationMappings () /*: any */ {
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Document.readerId',
          to: 'Reader.id'
        }
      },
      replies: {
        relation: Model.HasManyRelation,
        modelClass: Note,
        join: {
          from: 'Document.id',
          to: 'Note.documentId'
        }
      },
      context: {
        relation: Model.BelongsToOneRelation,
        modelClass: Publication,
        join: {
          from: 'Document.publicationId',
          to: 'Publication.id'
        }
      }
    }
  }

  static async createDocument (
    reader /*: any */,
    publicationId /*: string */,
    document /* :any */
  ) /*: any */ {
    const props = _.pick(document, ['mediaType', 'url', 'documentPath', 'json'])
    props.readerId = reader.id
    props.publicationId = publicationId
    return await Document.query().insertAndFetch(props)
  }

  static async byId (
    id /*: string */
  ) /*: Promise<{
    id: string,
    mediaType: string,
    json?: {},
    readerId: string,
    publicationId: string,
    documentPath: string,
    published: string,
    updated: string,
    reader: {id: string, json: any, readerId: string, published: string, updated: string},
    replies: Array<any>
  }> */ {
    return await Document.query()
      .findById(id)
      .eager('[reader, replies]')
  }

  // TODO: add tests
  static async byPath (
    publicationId /* :string */,
    documentPath /* :string */
  ) /* :Promise<any> */ {
    const document = await Document.query().findOne({
      documentPath,
      publicationId
    })
    if (!document) return null
    return document
  }

  static async getRedirectUrl (
    publicationId /* :string */,
    documentPath /* :string */
  ) /* :Promise<string|null> */ {
    const document = await Document.query().findOne({
      documentPath,
      publicationId
    })
    if (!document) return null
    return document.url
  }
}
module.exports = { Document }
