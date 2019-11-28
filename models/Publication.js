// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { Attribution } = require('./Attribution')
const { ReadActivity } = require('./ReadActivity')
const { Note } = require('./Note')
const { urlToId } = require('../utils/utils')
const elasticsearchQueue = require('../processFiles/searchQueue')
const { libraryCacheUpdate } = require('../utils/cache')
const languagesList = require('../utils/languages')

const metadataProps = [
  'inLanguage',
  'keywords',
  'url',
  'dateModified',
  'bookEdition',
  'bookFormat',
  'isbn',
  'copyrightYear',
  'genre',
  'license'
]
const attributionTypes = [
  'author',
  'editor',
  'contributor',
  'creator',
  'illustrator',
  'publisher',
  'translator'
]

/*::
type PublicationType = {
  id: string,
  abstract?: string,
  name: string,
  type: string,
  datePublished?: Date,
  numberOfPages: number,
  encodingFormat: string,
  metadata?: Object,
  readingOrder?: Object,
  resources?: Object,
  links?: Object,
  json?: Object,
  position?: Object,
  readerId: string,
  published: Date,
  updated: Date
};
*/

/**
 * @property {Reader} reader - Returns the reader that owns this publication.
 * @property {Document[]} attachment - Returns the documents attached to this publication.
 * @property {Note[]} replies - Returns the notes associated with this publication.
 * @property {Activity[]} outbox - Returns the activities on this publication. **Question** how should a publication reference its activities?
 * @property {Attribution[]} attributedTo - returns the `Attribution` objects (can be many) attributed with contributing to or creating this document.
 * @property {Tag[]} tag - Returns the publication's `Tag` objects (i.e. links, hashtags, stacks and categories).
 *
 * This class represents an individual publication and holds references to the documents it contains, its creators/contributors, the notes on both the documents and publication itself, the reader who owns it, and the tags used to group it (and its contents) with other publications.
 */
class Publication extends BaseModel {
  static get tableName () /*: string */ {
    return 'Publication'
  }
  get path () /*: string */ {
    return 'publication'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        readerId: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string' },
        author: { type: 'array' },
        abstract: { type: 'string' },
        editor: { type: 'array' },
        datePublished: { type: 'string', format: 'date-time' },
        inLanguage: { type: 'array' },
        keywords: { type: 'array' },
        url: { type: 'string', format: 'url' },
        dateModified: { type: 'string', format: 'date-time' },
        bookEdition: { type: 'string' },
        bookFormat: { type: 'string ' },
        isbn: { type: 'string' },
        copyrightYear: { type: 'integer' },
        genre: { type: 'romance' },
        license: { type: 'string' },
        numberOfPages: { type: 'integer' },
        encodingFormat: { type: 'string' },
        readingOrder: { type: 'object' },
        resources: { type: 'object' },
        links: { type: 'object' },
        json: { type: 'object' },
        updated: { type: 'string', format: 'date-time' },
        published: { type: 'string', format: 'date-time' },
        deleted: { type: 'string', format: 'date-time' }
      },
      required: ['name', 'readerId', 'type']
    }
  }
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')
    const { Document } = require('./Document.js')
    const { Tag } = require('./Tag.js')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Publication.readerId',
          to: 'Reader.id'
        }
      },
      attributions: {
        relation: Model.HasManyRelation,
        modelClass: Attribution,
        join: {
          from: 'Publication.id',
          to: 'Attribution.publicationId'
        }
      },
      replies: {
        relation: Model.HasManyRelation,
        modelClass: Note,
        join: {
          from: 'Publication.id',
          to: 'Note.publicationId'
        }
      },
      attachment: {
        relation: Model.HasManyRelation,
        modelClass: Document,
        join: {
          from: 'Publication.id',
          to: 'Document.publicationId'
        }
      },
      tags: {
        relation: Model.ManyToManyRelation,
        modelClass: Tag,
        join: {
          from: 'Publication.id',
          through: {
            from: 'publication_tag.publicationId',
            to: 'publication_tag.tagId'
          },
          to: 'Tag.id'
        }
      },
      readActivities: {
        relation: Model.HasManyRelation,
        modelClass: ReadActivity,
        join: {
          from: 'Publication.id',
          to: 'readActivity.publicationId'
        }
      }
    }
  }

  static _validateIncomingPub (publication /*: any */) /*: any */ {
    // check languages
    if (_.isString(publication.inLanguage)) {
      publication.inLanguage = [publication.inLanguage]
    }
    let invalid = []
    if (publication.inLanguage) {
      publication.inLanguage.forEach(lg => {
        if (languagesList.indexOf(lg) === -1) {
          invalid.push(lg)
        }
      })
    }
    if (invalid.length > 0) {
      throw new Error('invalid language(s): ' + invalid.toString())
    }

    // TODO: add more metadata validation?
  }

  static _formatIncomingPub (
    reader /*: any */,
    publication /*: any */
  ) /*: any */ {
    if (_.isString(publication.inLanguage)) {
      publication.inLanguage = [publication.inLanguage]
    }

    // store metadata
    const metadata = {}
    metadataProps.forEach(property => {
      metadata[property] = publication[property]
    })
    publication.metadata = metadata

    publication = _.pick(publication, [
      'id',
      'name',
      'type',
      'numberOfPages',
      'encodingFormat',
      'abstract',
      'datePublished',
      'json',
      'readingOrder',
      'resources',
      'links',
      'metadata'
    ])

    publication.readerId = urlToId(reader.id)

    if (publication.readingOrder) {
      publication.readingOrder = { data: publication.readingOrder }
    }
    if (publication.links) publication.links = { data: publication.links }
    if (publication.resources) {
      publication.resources = { data: publication.resources }
    }

    return publication
  }

  static async createPublication (
    reader /*: any */,
    publication /*: any */
  ) /*: Promise<PublicationType|Error> */ {
    try {
      this._validateIncomingPub(publication)
    } catch (err) {
      return err
    }

    const pub = this._formatIncomingPub(reader, publication)
    let createdPublication
    try {
      createdPublication = await Publication.query(
        Publication.knex()
      ).insertAndFetch(pub)
    } catch (err) {
      return err
    }

    // create attributions
    for (const type of attributionTypes) {
      if (publication[type]) {
        if (!_.isString(publication[type]) && !_.isObject(publication[type])) {
          return new Error(`invalid attribution for ${type}`)
        }
        if (_.isString(publication[type])) {
          publication[type] = [{ type: 'Person', name: publication[type] }]
        }
        createdPublication[type] = []
        for (const instance of publication[type]) {
          try {
            const createdAttribution = await Attribution.createAttribution(
              instance,
              type,
              createdPublication
            )
            createdPublication[type].push(createdAttribution)
          } catch (err) {
            return err
          }
        }
      }
    }

    // exceptionally, doing this instead of in the routes because of the complexity of
    // the whole file upload thing.
    await libraryCacheUpdate(reader.id)

    return createdPublication
  }

  static async byId (id /*: string */) /*: Promise<PublicationType|null> */ {
    const pub = await Publication.query()
      .findById(id)
      .eager('[reader, replies, tags, attributions]')

    if (!pub || pub.deleted) return null

    const latestReadActivity = await ReadActivity.getLatestReadActivity(id)
    if (latestReadActivity && latestReadActivity.selector) {
      pub.position = latestReadActivity.selector
    }
    if (pub.readingOrder) pub.readingOrder = pub.readingOrder.data
    if (pub.links) pub.links = pub.links.data
    if (pub.resources) pub.resources = pub.resources.data

    return pub
  }

  static async delete (id /*: string */) /*: Promise<number|null> */ {
    let publication = await Publication.query().findById(id)
    if (!publication || publication.deleted) {
      return null
    }

    // Mark documents associated with pub as deleted
    const { Document } = require('./Document')
    await Document.deleteDocumentsByPubId(id)

    // Delete Publication_Tag associated with pub
    const { Publication_Tag } = require('./Publications_Tags')
    await Publication_Tag.deletePubTagsOfPub(id)

    // remove documents from elasticsearch index
    if (elasticsearchQueue) {
      await elasticsearchQueue.add({ type: 'delete', publicationId: id })
    }

    const date = new Date().toISOString()
    return await Publication.query().patchAndFetchById(id, { deleted: date })
  }

  static async deleteNotes (id /*: string */) /*: Promise<number|null> */ {
    const time = new Date().toISOString()
    return await Note.query()
      .patch({ deleted: time })
      .where('publicationId', '=', id)
  }

  static async update (
    newPubObj /*: any */
  ) /*: Promise<PublicationType|null> */ {
    // Create metadata
    const metadata = {}
    metadataProps.forEach(property => {
      metadata[property] = newPubObj[property]
    })

    // Fetch the Publication that will be modified
    let publication = await Publication.query().findById(urlToId(newPubObj.id))
    if (!publication) {
      return null
    }

    const modifications = _.pick(newPubObj, [
      'name',
      'abstract',
      'type',
      'datePublished',
      'json',
      'readingOrder',
      'resources',
      'links',
      'numberOfPages',
      'encodingFormat'
    ])

    if (metadata) {
      modifications.metadata = metadata
    }

    if (modifications.readingOrder) {
      // $FlowFixMe
      modifcations.readingOrder = { data: modifications.readingOrder }
    }
    if (modifications.links) modifications.links = { data: modifications.links }
    if (modifications.resources) {
      modifications.resources = { data: modifications.resources }
    }

    let updatedPub
    try {
      updatedPub = await Publication.query().patchAndFetchById(
        urlToId(newPubObj.id),
        modifications
      )
    } catch (err) {
      return err
    }

    // Update Attributions if necessary
    for (const role of attributionTypes) {
      if (newPubObj[role]) {
        // Delete the previous attributions for this role
        await Attribution.deleteAttributionOfPub(urlToId(newPubObj.id), role)

        // Assign new attributions
        updatedPub[role] = []
        for (let i = 0; i < newPubObj[role].length; i++) {
          const attribution = await Attribution.createAttribution(
            newPubObj[role][i],
            role,
            publication
          )
          updatedPub[role].push(attribution)
        }
      }
    }

    return updatedPub
  }

  $beforeInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeInsert(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.updated = new Date().toISOString()
    })
  }

  $formatJson (json /*: any */) /*: any */ {
    json = super.$formatJson(json)
    json.id = json.id + '/'
    if (json.attributions) {
      attributionTypes.forEach(type => {
        json[type] = json.attributions.filter(
          attribution => attribution.role === type
        )
      })
      json.attributions = undefined
    }

    if (json.links && json.links.data) {
      json.links = json.links.data
    }
    if (json.resources && json.resources.data) {
      json.resources = json.resources.data
    }
    if (json.readingOrder && json.readingOrder.data) {
      json.readingOrder = json.readingOrder.data
    }

    if (json.metadata) {
      metadataProps.forEach(prop => {
        json[prop] = json.metadata[prop]
      })
      json.metadata = undefined
    }
    json = _.omitBy(json, _.isNil)

    return json
  }
}

module.exports = { Publication }
