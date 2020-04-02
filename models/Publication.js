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
const crypto = require('crypto')

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
  'license',
  'inDirection'
]
const attributionTypes = [
  'author',
  'editor',
  'contributor',
  'creator',
  'illustrator',
  'publisher',
  'translator',
  'copyrightHolder'
]

const linkProperties = [
  'url',
  'encodingFormat',
  'name',
  'description',
  'rel',
  'integrity',
  'length',
  'type'
]

const types = [
  'Publication',
  'Article',
  'Blog',
  'Book',
  'Chapter',
  'Collection',
  'Comment',
  'Conversation',
  'Course',
  'Dataset',
  'Drawing',
  'Episode',
  'Manuscript',
  'Map',
  'MediaObject',
  'MusicRecordig',
  'Painting',
  'Photograph',
  'Play',
  'Poster',
  'PublicationIssue',
  'PublicationVolume',
  'Review',
  'ShortStory',
  'Thesis',
  'VisualArtwork',
  'WebContent'
]

const bookFormats = [
  'AudiobookFormat',
  'EBook',
  'GraphicNovel',
  'Hardcover',
  'Paperback'
]
const statusMap = {
  test: 99
}

/*::
type PublicationType = {
  id: string,
  abstract?: string,
  name: string,
  type: string,
  datePublished?: Date,
  numberOfPages?: number,
  wordCount?: number,
  status: number,
  description?: string,
  encodingFormat?: string,
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
        author: { type: ['array', 'null'] },
        abstract: { type: ['string', 'null'] },
        description: { type: ['string', 'null'] },
        editor: { type: ['array', 'null'] },
        datePublished: { type: ['string', 'null'], format: 'date-time' },
        inLanguage: { type: ['array', 'null'] },
        keywords: { type: ['array', 'null'] },
        url: { type: ['string', 'null'], format: 'url' },
        dateModified: { type: ['string', 'null'], format: 'date-time' },
        bookEdition: { type: ['string', 'null'] },
        bookFormat: { type: ['string ', 'null'] },
        isbn: { type: ['string', 'null'] },
        copyrightYear: { type: ['integer', 'null'] },
        genre: { type: ['string', 'null'] },
        license: { type: ['string', 'null'] },
        numberOfPages: { type: ['integer', 'null'] },
        wordCount: { type: ['integer', 'null'] },
        status: { type: ['integer', 'null'] },
        encodingFormat: { type: ['string', 'null'] },
        readingOrder: { type: ['object', 'null'] },
        resources: { type: ['object', 'null'] },
        links: { type: ['object', 'null'] },
        json: { type: ['object', 'null'] },
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

  static _isValidLink (link /*: any */) /*: boolean */ {
    if (_.isObject(link) && !link.url) {
      return false
    }
    if (!_.isObject(link) && !_.isString(link)) {
      return false
    }
    return true
  }

  // TODO: should not be static (wait until old deprecated code is removed)
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
      if (invalid.length === 1) {
        throw new Error(
          `Publication validation error: ${
            invalid[0]
          } is not a valid language code`
        )
      } else {
        throw new Error(
          `Publication validation error: ${invalid.toString()} are not valid language codes`
        )
      }
    }

    // check type -- does not check if type is here. That is checked by objection.js
    if (publication.type && types.indexOf(publication.type) === -1) {
      throw new Error(
        `Publication validation error: ${publication.type} is not a valid type.`
      )
    }

    // check dateModified - should be a timestamp
    if (
      publication.dateModified &&
      !(new Date(publication.dateModified).getTime() > 0)
    ) {
      throw new Error(
        `Publication validation error: dateModified must be a timestamp. ${
          publication.dateModified
        } is not a valid timestamp`
      )
    }

    // check bookEdition - should be a string
    if (publication.bookEdition && !_.isString(publication.bookEdition)) {
      throw new Error(
        'Publication validation error: bookEdition should be a string'
      )
    }

    // check bookFormat
    if (
      publication.bookFormat &&
      bookFormats.indexOf(publication.bookFormat) === -1
    ) {
      throw new Error(
        `Publication validation error: ${
          publication.bookFormat
        } is not a valid bookFormat`
      )
    }

    // check isbn - should be string.
    if (publication.isbn && !_.isString(publication.isbn)) {
      throw new Error('Publication validation error: isbn should be a string')
    }

    // check genre - should be a string
    if (publication.genre && !_.isString(publication.genre)) {
      throw new Error('Publication validation error: genre should be a string')
    }

    // check url - should be a string
    if (publication.url && !_.isString(publication.url)) {
      throw new Error('Publication validation error: url should be a string')
    }

    // check keywords - should be a string or an array of strings
    if (publication.keywords) {
      if (_.isArray(publication.keywords)) {
        publication.keywords.forEach(word => {
          if (!_.isString(word)) {
            throw new Error(
              'Publication validation error: keywords should be strings'
            )
          }
        })
      } else if (!_.isString(publication.keywords)) {
        throw new Error(
          'Publication validation error: keywords should be a string or an array of strings'
        )
      }
    }

    // check link objects
    if (publication.links) {
      if (!_.isArray(publication.links)) {
        throw new Error(
          `Publication validation error: links must be an array of links`
        )
      } else {
        publication.links.forEach(link => {
          if (!this._isValidLink(link)) {
            throw new Error(
              `Publication validation error: links items must be either a string or an object with a url property`
            )
          }
        })
      }
    }

    // check resources objects
    if (publication.resources) {
      if (!_.isArray(publication.resources)) {
        throw new Error(
          `Publication validation error: resources must be an array of links`
        )
      } else {
        publication.resources.forEach(link => {
          if (!this._isValidLink(link)) {
            throw new Error(
              `Publication validation error: resources items must be either a string or an object with a url property`
            )
          }
        })
      }
    }

    // check readingOrder objects
    if (publication.readingOrder) {
      if (!_.isArray(publication.readingOrder)) {
        throw new Error(
          `Publication validation error: readingOrder must be an array of links`
        )
      } else {
        publication.readingOrder.forEach(link => {
          if (!this._isValidLink(link)) {
            throw new Error(
              `Publication validation error: readingOrder items must be either a string or an object with a url property`
            )
          }
        })
      }
    }

    if (
      publication.inDirection &&
      publication.inDirection !== 'ltr' &&
      publication.inDirection !== 'rtl'
    ) {
      throw new Error(
        'Publication validation error: inDirection should be either "ltr" or "rtl"'
      )
    }

    if (publication.status && !statusMap[publication.status]) {
      throw new Error(
        `Publication validation error: ${
          publication.status
        } is not a valid status`
      )
    }
  }

  // TODO: should not be static (wait until old deprecated code is removed)
  static _formatIncomingPub (
    reader /*: any */,
    publication /*: any */
  ) /*: any */ {
    // IMPORTANT: formating for the metadata property should be done here, before it is stored in a metadata object

    // language
    if (_.isString(publication.inLanguage)) {
      publication.inLanguage = [publication.inLanguage]
    }

    // keywords
    if (publication.keywords) {
      if (_.isString(publication.keywords)) {
        publication.keywords = [publication.keywords.toLowerCase()]
      } else {
        publication.keywords = publication.keywords.map(keyword =>
          keyword.toLowerCase()
        )
      }
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
      'status',
      'wordCount',
      'description',
      'metadata'
    ])

    if (reader) {
      publication.readerId = urlToId(reader.id)
    }

    if (publication.readingOrder) {
      publication.readingOrder.forEach((link, i) => {
        if (_.isString(link)) {
          publication.readingOrder[i] = { url: link }
        } else {
          publication.readingOrder[i] = _.pick(link, linkProperties)
        }
      })
      publication.readingOrder = { data: publication.readingOrder }
    }
    if (publication.links) {
      publication.links.forEach((link, i) => {
        if (_.isString(link)) {
          publication.links[i] = { url: link }
        } else {
          publication.links[i] = _.pick(link, linkProperties)
        }
      })
      publication.links = { data: publication.links }
    }
    if (publication.resources && _.isArray(publication.resources)) {
      publication.resources.forEach((link, i) => {
        if (_.isString(link)) {
          publication.resources[i] = { url: link }
        } else {
          publication.resources[i] = _.pick(link, linkProperties)
        }
      })
      publication.resources = { data: publication.resources }
    }

    if (publication.status) {
      publication.status = statusMap[publication.status]
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
      throw err
    }
    const pub = this._formatIncomingPub(reader, publication)
    let createdPublication
    pub.id = `${urlToId(reader.id)}-${crypto.randomBytes(5).toString('hex')}`
    try {
      createdPublication = await Publication.query(
        Publication.knex()
      ).insertAndFetch(pub)
    } catch (err) {
      throw err
    }

    // create attributions
    const attributions = await Attribution.createAttributionsForPublication(
      publication,
      pub.id,
      urlToId(reader.id)
    )
    createdPublication = Object.assign(createdPublication, attributions)

    // exceptionally, doing this instead of in the routes because of the complexity of
    // the whole file upload thing.
    await libraryCacheUpdate(reader.id)

    return createdPublication
  }

  static async byId (id /*: string */) /*: Promise<PublicationType|null> */ {
    const pub = await Publication.query()
      .findById(id)
      .withGraphFetched(
        '[reader, replies(notDeleted), tags(notDeleted), attributions]'
      )
      .modifiers({
        notDeleted (builder) {
          builder.whereNull('deleted')
        }
      })

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

  static async checkIfExists (id /*: string */) /*: Promise<boolean> */ {
    const pub = await Publication.query().findById(id)
    if (!pub || pub.deleted) {
      return false
    } else return true
  }

  static async delete (id /*: string */) {
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
    return await Publication.query().patchAndFetchById(id, {
      deleted: date
    })
  }

  // TODO: remove this method once the old delete activity is removed
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

  static async batchUpdate (body /*: any */) /*: Promise<any> */ {
    const arrayProperties = attributionTypes.concat(['keywords', 'inLanguage'])

    if (body.operation === 'replace') {
      if (arrayProperties.indexOf(body.property) > -1) {
        throw new Error('no replace array')
      }

      let modification = {}
      modification[body.property] = body.value
      try {
        Publication._validateIncomingPub(modification)
      } catch (err) {
        throw err
      }
      const modificationFormatted = this._formatIncomingPub(null, modification)
      return await Publication.query()
        .patch(modificationFormatted)
        .whereIn('id', body.publications)
    }
  }

  async update (body /*: any */) /*: Promise<PublicationType|null> */ {
    const id = urlToId(this.id)
    const publication = this
    try {
      Publication._validateIncomingPub(body)
    } catch (err) {
      throw err
    }
    const modifications = Publication._formatIncomingPub(null, body)

    let updatedPub
    try {
      updatedPub = await Publication.query().patchAndFetchById(
        id,
        modifications
      )
    } catch (err) {
      throw err
    }
    // attach attributions to the udpatedPub object
    if (publication.attributions) {
      attributionTypes.forEach(type => {
        updatedPub[type] = publication.attributions.filter(
          attribution => attribution.role === type
        )
      })
      publication.attributions = undefined
    }

    // delete attributions that were replacced
    for (const role of attributionTypes) {
      if (body[role]) {
        if (!_.isString(body[role]) && !_.isObject(body[role])) {
          throw new Error(
            `${role} attribution validation error: attribution should be either an attribution object or a string`
          )
        }
        // Delete the previous attributions for this role
        await Attribution.deleteAttributionOfPub(id, role)
      } else if (body[role] === null) {
        await Attribution.deleteAttributionOfPub(id, role)
        updatedPub[role] = null
      }
    }

    // Update Attributions if necessary
    const attributions = await Attribution.createAttributionsForPublication(
      body,
      id,
      urlToId(updatedPub.readerId)
    )
    updatedPub = Object.assign(updatedPub, attributions)

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
    json.shortId = urlToId(json.id)
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

    if (json.status) {
      const statusString = _.findKey(statusMap, v => {
        return v === json.status
      })
      json.status = statusString
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
