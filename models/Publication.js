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
        author: { type: 'array' },
        abstract: { type: 'string' },
        description: { type: 'string' },
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
        wordCount: { type: 'integer' },
        status: { type: 'integer' },
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

  static _isValidLink (link /*: any */) /*: boolean */ {
    if (_.isObject(link) && !link.url) {
      return false
    }
    if (!_.isObject(link) && !_.isString(link)) {
      return false
    }
    return true
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

    // check type -- does not check if type is here. That is checked by objection.js
    if (publication.type && types.indexOf(publication.type) === -1) {
      throw new Error(
        `${publication.type} is not a valid type for a publication`
      )
    }

    // check dateModified - should be a timestamp
    if (
      publication.dateModified &&
      !(new Date(publication.dateModified).getTime() > 0)
    ) {
      throw new Error(`${publication.dateModified} is not a valid timestamp`)
    }

    // check bookEdition - should be a string
    if (publication.bookEdition && !_.isString(publication.bookEdition)) {
      throw new Error('bookEdition should be a string')
    }

    // check bookFormat
    if (
      publication.bookFormat &&
      bookFormats.indexOf(publication.bookFormat) === -1
    ) {
      throw new Error(`${publication.bookFormat} is not avalid bookFormat`)
    }

    // check isbn - should be string.
    if (publication.isbn && !_.isString(publication.isbn)) {
      throw new Error('isbn should be a string')
    }

    // check genre - should be a string
    if (publication.genre && !_.isString(publication.genre)) {
      throw new Error('genre should be a string')
    }

    // check url - should be a string
    if (publication.url && !_.isString(publication.url)) {
      throw new Error('url should be a string')
    }

    // check keywords - should be a string or an array of strings
    if (publication.keywords) {
      let keywordError
      if (_.isArray(publication.keywords)) {
        publication.keywords.forEach(word => {
          if (!_.isString(word)) {
            keywordError = 'keywords should be strings'
          }
        })
      } else if (!_.isString(publication.keywords)) {
        keywordError = 'keywords should be a string or an array of strings'
      }
      if (keywordError) {
        throw new Error(keywordError)
      }
    }

    // check link objects
    let linksError
    if (publication.links) {
      if (!_.isArray(publication.links)) {
        linksError = `links must be an array of links`
      } else {
        publication.links.forEach(link => {
          if (!this._isValidLink(link)) {
            linksError = `links must be either a string or an object with a url property`
          }
        })
      }
    }
    if (linksError) throw new Error(linksError)

    // check resources objects
    let resourcesError
    if (publication.resources) {
      if (!_.isArray(publication.resources)) {
        resourcesError = `links must be an array of links`
      } else {
        publication.resources.forEach(link => {
          if (!this._isValidLink(link)) {
            resourcesError = `links must be either a string or an object with a url property`
          }
        })
      }
    }
    if (resourcesError) throw new Error(resourcesError)

    // check readingOrder objects
    let readingOrderError
    if (publication.readingOrder) {
      if (!_.isArray(publication.readingOrder)) {
        readingOrderError = `links must be an array of links`
      } else {
        publication.readingOrder.forEach(link => {
          if (!this._isValidLink(link)) {
            readingOrderError = `links must be either a string or an object with a url property`
          }
        })
      }
    }
    if (readingOrderError) throw new Error(readingOrderError)
    if (
      publication.inDirection &&
      publication.inDirection !== 'ltr' &&
      publication.inDirection !== 'rtl'
    ) {
      throw new Error('inDirection should be either "ltr" or "rtl"')
    }

    if (publication.status && !statusMap[publication.status]) {
      throw new Error(`invalid status: ${publication.status}`)
    }
  }

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
    if (publication.keywords && _.isString(publication.keywords)) {
      publication.keywords = [publication.keywords]
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
    try {
      this._validateIncomingPub(newPubObj)
    } catch (err) {
      return err
    }

    const modifications = this._formatIncomingPub(null, newPubObj)

    // Fetch the Publication that will be modified
    let publication = await Publication.query().findById(urlToId(newPubObj.id))
    if (!publication) {
      return null
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
