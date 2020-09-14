// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { Attribution } = require('./Attribution')
const { ReadActivity } = require('./ReadActivity')
const { Note } = require('./Note')
const { urlToId } = require('../utils/utils')
const { libraryCacheUpdate } = require('../utils/cache')
const languagesList = require('../utils/languages')
const crypto = require('crypto')
const { Source_Tag } = require('./Source_Tag')
const { Notebook_Source } = require('./Notebook_Source')
const debug = require('debug')('ink:models:Source')

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
  'Source',
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

/*::
type SourceType = {
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

class Source extends BaseModel {
  static get tableName () /*: string */ {
    return 'Source'
  }
  get path () /*: string */ {
    return 'source'
  }

  static get attributionTypes () /*: Array<string> */ {
    return attributionTypes
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
        deleted: { type: 'string', format: 'date-time' },
        referenced: { type: 'string', format: 'date-time' }
      },
      required: ['name', 'readerId', 'type']
    }
  }
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')
    const { Tag } = require('./Tag.js')
    const { Notebook } = require('./Notebook')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Source.readerId',
          to: 'Reader.id'
        }
      },
      attributions: {
        relation: Model.HasManyRelation,
        modelClass: Attribution,
        join: {
          from: 'Source.id',
          to: 'Attribution.sourceId'
        }
      },
      replies: {
        relation: Model.HasManyRelation,
        modelClass: Note,
        join: {
          from: 'Source.id',
          to: 'Note.sourceId'
        }
      },
      tags: {
        relation: Model.ManyToManyRelation,
        modelClass: Tag,
        join: {
          from: 'Source.id',
          through: {
            from: 'source_tag.sourceId',
            to: 'source_tag.tagId'
          },
          to: 'Tag.id'
        }
      },
      notebooks: {
        relation: Model.ManyToManyRelation,
        modelClass: Notebook,
        join: {
          from: 'Source.id',
          through: {
            from: 'notebook_source.sourceId',
            to: 'notebook_source.notebookId'
          },
          to: 'Notebook.id'
        }
      },
      readActivities: {
        relation: Model.HasManyRelation,
        modelClass: ReadActivity,
        join: {
          from: 'Source.id',
          to: 'readActivity.sourceId'
        }
      }
    }
  }

  static _isValidLink (link /*: any */) /*: boolean */ {
    debug('**_isValidLink**')
    debug('link: ', link)
    if (_.isObject(link) && !link.url) {
      return false
    }
    if (!_.isObject(link) && !_.isString(link)) {
      return false
    }
    return true
  }

  // TODO: should not be static (wait until old deprecated code is removed)
  static _validateIncomingSource (source /*: any */) /*: any */ {
    debug('**_validateIncomingSource**')
    debug('incoming source: ', source)
    // check languages
    if (_.isString(source.inLanguage)) {
      source.inLanguage = [source.inLanguage]
    }
    let invalid = []
    if (source.inLanguage) {
      source.inLanguage.forEach(lg => {
        if (languagesList.indexOf(lg) === -1) {
          invalid.push(lg)
        }
      })
    }
    if (invalid.length > 0) {
      if (invalid.length === 1) {
        throw new Error(
          `Source validation error: ${invalid[0]} is not a valid language code`
        )
      } else {
        throw new Error(
          `Source validation error: ${invalid.toString()} are not valid language codes`
        )
      }
    }

    // check type -- does not check if type is here. That is checked by objection.js
    if (source.type && types.indexOf(source.type) === -1) {
      throw new Error(
        `Source validation error: ${source.type} is not a valid type.`
      )
    }

    // check dateModified - should be a timestamp
    if (source.dateModified && !(new Date(source.dateModified).getTime() > 0)) {
      throw new Error(
        `Source validation error: dateModified must be a timestamp. ${
          source.dateModified
        } is not a valid timestamp`
      )
    }

    // check bookEdition - should be a string
    if (source.bookEdition && !_.isString(source.bookEdition)) {
      throw new Error('Source validation error: bookEdition should be a string')
    }

    // check bookFormat
    if (source.bookFormat && bookFormats.indexOf(source.bookFormat) === -1) {
      throw new Error(
        `Source validation error: ${
          source.bookFormat
        } is not a valid bookFormat`
      )
    }

    // check isbn - should be string.
    if (source.isbn && !_.isString(source.isbn)) {
      throw new Error('Source validation error: isbn should be a string')
    }

    // check genre - should be a string
    if (source.genre && !_.isString(source.genre)) {
      throw new Error('Source validation error: genre should be a string')
    }

    // check url - should be a string
    if (source.url && !_.isString(source.url)) {
      throw new Error('Source validation error: url should be a string')
    }

    // check keywords - should be a string or an array of strings
    if (source.keywords) {
      if (_.isArray(source.keywords)) {
        source.keywords.forEach(word => {
          if (!_.isString(word)) {
            throw new Error(
              'Source validation error: keywords should be strings'
            )
          }
        })
      } else if (!_.isString(source.keywords)) {
        throw new Error(
          'Source validation error: keywords should be a string or an array of strings'
        )
      }
    }

    // check link objects
    if (source.links) {
      if (!_.isArray(source.links)) {
        throw new Error(
          `Source validation error: links must be an array of links`
        )
      } else {
        source.links.forEach(link => {
          if (!this._isValidLink(link)) {
            throw new Error(
              `Source validation error: links items must be either a string or an object with a url property`
            )
          }
        })
      }
    }

    // check resources objects
    if (source.resources) {
      if (!_.isArray(source.resources)) {
        throw new Error(
          `Source validation error: resources must be an array of links`
        )
      } else {
        source.resources.forEach(link => {
          if (!this._isValidLink(link)) {
            throw new Error(
              `Source validation error: resources items must be either a string or an object with a url property`
            )
          }
        })
      }
    }

    // check readingOrder objects
    if (source.readingOrder) {
      if (!_.isArray(source.readingOrder)) {
        throw new Error(
          `Source validation error: readingOrder must be an array of links`
        )
      } else {
        source.readingOrder.forEach(link => {
          if (!this._isValidLink(link)) {
            throw new Error(
              `Source validation error: readingOrder items must be either a string or an object with a url property`
            )
          }
        })
      }
    }

    if (
      source.inDirection &&
      source.inDirection !== 'ltr' &&
      source.inDirection !== 'rtl'
    ) {
      throw new Error(
        'Source validation error: inDirection should be either "ltr" or "rtl"'
      )
    }

    if (source.status && !statusMap[source.status]) {
      throw new Error(
        `Source validation error: ${source.status} is not a valid status`
      )
    }
  }

  // TODO: should not be static (wait until old deprecated code is removed)
  static _formatIncomingSource (
    reader /*: any */,
    source /*: any */
  ) /*: any */ {
    // IMPORTANT: formating for the metadata property should be done here, before it is stored in a metadata object
    debug('**_formatIncomingSource**')
    debug('reader: ', reader)
    debug('incoming source: ', source)
    // language
    if (_.isString(source.inLanguage)) {
      source.inLanguage = [source.inLanguage]
    }

    // keywords
    if (source.keywords) {
      if (_.isString(source.keywords)) {
        source.keywords = [source.keywords.toLowerCase()]
      } else {
        source.keywords = source.keywords.map(keyword => keyword.toLowerCase())
      }
    }
    // store metadata
    let metadata = {}
    metadataProps.forEach(property => {
      metadata[property] = source[property]
    })
    metadata = _.omitBy(metadata, _.isUndefined)
    if (!_.isEmpty(metadata)) {
      source.metadata = metadata
    }

    source = _.pick(source, [
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
      source.readerId = urlToId(reader.id)
    }

    if (source.readingOrder) {
      source.readingOrder.forEach((link, i) => {
        if (_.isString(link)) {
          source.readingOrder[i] = { url: link }
        } else {
          source.readingOrder[i] = _.pick(link, linkProperties)
        }
      })
      source.readingOrder = { data: source.readingOrder }
    }
    if (source.links) {
      source.links.forEach((link, i) => {
        if (_.isString(link)) {
          source.links[i] = { url: link }
        } else {
          source.links[i] = _.pick(link, linkProperties)
        }
      })
      source.links = { data: source.links }
    }
    if (source.resources && _.isArray(source.resources)) {
      source.resources.forEach((link, i) => {
        if (_.isString(link)) {
          source.resources[i] = { url: link }
        } else {
          source.resources[i] = _.pick(link, linkProperties)
        }
      })
      source.resources = { data: source.resources }
    }

    if (source.status) {
      source.status = statusMap[source.status]
    }
    debug('formatted source: ', source)
    return source
  }

  static async createSource (
    reader /*: any */,
    source /*: any */
  ) /*: Promise<SourceType> */ {
    debug('**createSource**')
    debug('reader: ', reader)
    debug('incoming source: ', source)

    this._validateIncomingSource(source)

    const formattedSource = this._formatIncomingSource(reader, source)
    formattedSource.id = `${urlToId(reader.id)}-${crypto
      .randomBytes(5)
      .toString('hex')}`
    let createdSource = await Source.query(Source.knex()).insertAndFetch(
      formattedSource
    )

    // create attributions
    const attributions = await Attribution.createAttributionsForSource(
      source,
      formattedSource.id,
      urlToId(reader.id)
    )
    createdSource = Object.assign(createdSource, attributions)

    // exceptionally, doing this instead of in the routes because of the complexity of
    // the whole file upload thing.
    await libraryCacheUpdate(reader.id)

    return createdSource
  }

  static async createSourceInNotebook (
    reader /*: any */,
    notebookId /*: string */,
    source /*: any */
  ) {
    debug('**createSourceInNotebook**')
    debug('reader: ', reader)
    debug('notebookId: ', notebookId)
    debug('source: ', source)
    const createdSource = await this.createSource(reader, source)
    debug('created source: ', createdSource)
    if (createdSource) {
      try {
        // $FlowFixMe
        await Notebook_Source.addSourceToNotebook(
          notebookId,
          urlToId(createdSource.id)
        )
      } catch (err) {
        debug('error when adding to notebook: ', err.message)
        this.hardDelete(createdSource.id)
        throw err
      }
    }

    return createdSource
  }

  static async hardDelete (sourceId /*: ?string */) {
    debug('**hardDelete**')
    debug('sourceId: ', sourceId)
    sourceId = urlToId(sourceId)
    await Source.query()
      .delete()
      .where({
        id: sourceId
      })
  }

  static async byId (id /*: string */) /*: Promise<SourceType|null> */ {
    debug('**byId**')
    const source = await Source.query()
      .findById(id)
      .withGraphFetched(
        '[reader, replies(notDeleted), tags(notDeleted), attributions]'
      )
      .modifiers({
        notDeleted (builder) {
          builder.whereNull('deleted')
        }
      })
    debug('retrieved source: ', source)
    if (!source || source.deleted || source.referenced) return null

    const latestReadActivity = await ReadActivity.getLatestReadActivity(id)
    debug('latest readActivity: ', latestReadActivity)
    if (latestReadActivity && latestReadActivity.selector) {
      source.position = latestReadActivity.selector
    }
    if (source.readingOrder) source.readingOrder = source.readingOrder.data
    if (source.links) source.links = source.links.data
    if (source.resources) source.resources = source.resources.data
    debug('source to return: ', source)
    return source
  }

  static async checkIfExists (id /*: string */) /*: Promise<boolean> */ {
    debug('**checkIfExists**')
    debug('id: ', id)
    const source = await Source.query().findById(id)
    if (!source || source.deleted || source.referenced) {
      return false
    } else return true
  }

  static async delete (id /*: string */) /*: Promise<number|null> */ {
    debug('**delete**')
    debug('id: ', id)

    // Delete Source_Tag associated with source
    await Source_Tag.deleteSourceTagsOfSource(id)

    // remove documents from elasticsearch index
    // if (elasticsearchQueue) {
    //   await elasticsearchQueue.add({ type: 'delete', sourceId: id })
    // }
    const date = new Date().toISOString()
    return await Source.query()
      .patchAndFetchById(id, { deleted: date })
      .whereNull('deleted')
  }

  static async deleteNotes (id /*: string */) /*: Promise<number|null> */ {
    debug('**deleteNotes**')
    debug('id: ', id)
    const time = new Date().toISOString()
    return await Note.query()
      .patch({ deleted: time })
      .where('sourceId', '=', id)
  }

  static async toReference (id /*: string */) /*: Promise<any> */ {
    const date = new Date().toISOString()
    return await Source.query().patchAndFetchById(id, {
      referenced: date,
      links: null,
      resources: null,
      readingOrder: null
    })
  }

  static async batchUpdate (body /*: any */) /*: Promise<any> */ {
    debug('**batchUpdate**')
    debug('body: ', body)
    let modification = {}
    modification[body.property] = body.value

    Source._validateIncomingSource(modification)

    let modificationFormatted = this._formatIncomingSource(null, modification)
    modificationFormatted = _.omit(modificationFormatted, 'metadata')
    return await Source.query()
      .patch(modificationFormatted)
      .whereIn('id', body.sources)
  }

  static async batchUpdateAddArrayProperty (
    body /*: any */
  ) /*: Promise<any> */ {
    debug('**batchUpdateAddArrayProperty**')
    debug('body: ', body)
    const result = []
    for (const sourceId of body.sources) {
      const source = await Source.query().findById(sourceId)
      if (!source) {
        result.push({
          id: sourceId,
          status: 404,
          message: `No Source found with id ${sourceId}`
        })
      } else {
        // add item to existing list
        if (
          source &&
          source.metadata[body.property] &&
          source.metadata[body.property].length &&
          source.metadata[body.property].indexOf(body.value[0]) === -1
        ) {
          const newMetadata = source.metadata
          newMetadata[body.property] = source.metadata[body.property].concat(
            body.value
          )
          await Source.query().patchAndFetchById(sourceId, {
            metadata: newMetadata
          })
          result.push({
            id: sourceId,
            status: 204
          })
          // add item to empty list or undefined prop
        } else if (
          !source.metadata[body.property] ||
          source.metadata[body.property].length === 0
        ) {
          const newMetadata = source.metadata
          newMetadata[body.property] = body.value
          await Source.query().patchAndFetchById(sourceId, {
            metadata: newMetadata
          })
          result.push({
            id: sourceId,
            status: 204
          })
          // if already exists in the list, do not do anything
        } else {
          result.push({
            id: sourceId,
            status: 204
          })
        }
      }
    }
    return result
  }

  static async batchUpdateRemoveArrayProperty (
    body /*: any */
  ) /*: Promise<any> */ {
    debug('**batchUpdateRemoveArrayProperty**')
    debug('body: ', body)
    const result = []
    for (const sourceId of body.sources) {
      const source = await Source.query().findById(sourceId)
      if (!source) {
        result.push({
          id: sourceId,
          status: 404,
          message: `No Source found with id ${sourceId}`
        })
      } else {
        // remove existing item from list
        if (
          source &&
          source.metadata[body.property] &&
          source.metadata[body.property].indexOf(body.value[0]) > -1
        ) {
          const newMetadata = source.metadata
          newMetadata[body.property] = newMetadata[body.property].filter(
            item => {
              return body.value.indexOf(item) === -1
            }
          )
          await Source.query().patchAndFetchById(sourceId, {
            metadata: newMetadata
          })
          result.push({
            id: sourceId,
            status: 204
          })
          // r
        } else {
          // if not in the list, do nothing
          result.push({
            id: sourceId,
            status: 204
          })
        }
      }
    }
    return result
  }

  static async batchUpdateAddAttribution (body /*: any */) /*: Promise<any> */ {
    debug('**batchUpdateAddAttribution**')
    debug('body: ', body)
    const result = []

    for (const sourceId of body.sources) {
      const source = await Source.query()
        .findById(sourceId)
        .withGraphFetched('attributions')
      if (!source) {
        result.push({
          id: sourceId,
          status: 404,
          message: `No Source found with id ${sourceId}`
        })
      } else {
        for (const attribution of body.value) {
          // normalize name
          let normalizedName
          if (_.isString(attribution)) {
            normalizedName = Attribution.normalizeName(attribution)
          }

          // if attribution already exists, do nothing
          if (
            _.find(source.attributions, {
              role: body.property,
              normalizedName
            })
          ) {
            result.push({
              id: sourceId,
              status: 204,
              value: attribution
            })
          } else {
            try {
              await Attribution.createSingleAttribution(
                body.property,
                attribution,
                sourceId,
                urlToId(source.readerId)
              )
              result.push({
                id: sourceId,
                status: 204,
                value: attribution
              })
            } catch (err) {
              result.push({
                id: sourceId,
                status: 400,
                message: err.message,
                value: attribution
              })
            }
          }
        }
      }
    }
    return result
  }

  static async batchUpdateRemoveAttribution (
    body /*: any */
  ) /*: Promise<any> */ {
    debug('**batchUpdateRemoveAttribution**')
    debug('body: ', body)
    const result = []
    for (const sourceId of body.sources) {
      const source = await Source.query()
        .findById(sourceId)
        .withGraphFetched('attributions')
      if (!source) {
        result.push({
          id: sourceId,
          status: 404,
          message: `No Source found with id ${sourceId}`
        })
      } else {
        for (const attribution of body.value) {
          // normalize name
          let normalizedName = ''
          if (_.isString(attribution)) {
            normalizedName = Attribution.normalizeName(attribution)
          }
          // if attribution already exists, remove it
          if (
            _.find(source.attributions, {
              role: body.property,
              normalizedName
            })
          ) {
            try {
              await Attribution.deleteAttribution(
                sourceId,
                body.property,
                normalizedName
              )
              result.push({
                id: sourceId,
                status: 204,
                value: attribution
              })
            } catch (err) {
              result.push({
                id: sourceId,
                status: 400,
                value: attribution
              })
            }
          } else {
            result.push({
              id: sourceId,
              status: 204,
              value: attribution
            })
          }
        }
      }
    }
    return result
  }

  static async batchUpdateAddTags (body /*: any */) /*: Promise<any> */ {
    debug('**batchUpdateAddTags**')
    debug('body: ', body)
    let result = []
    for (const sourceId of body.sources) {
      const source = await Source.query()
        .findById(sourceId)
        .withGraphFetched('tags')
      if (!source) {
        result.push({
          id: sourceId,
          status: 404,
          message: `No Source found with id ${sourceId}`
        })
      } else {
        for (const tag of body.value) {
          // if tag already exists
          if (
            _.find(source.tags, {
              id: urlToId(tag)
            })
          ) {
            result.push({
              id: sourceId,
              status: 204,
              value: tag
            })
          } else {
            try {
              await Source_Tag.addTagToSource(sourceId, tag)
              result.push({
                id: sourceId,
                status: 204,
                value: tag
              })
            } catch (err) {
              if (err.message === 'no tag') {
                result.push({
                  id: sourceId,
                  status: 404,
                  value: tag,
                  message: `No Tag found with id ${tag}`
                })
              } else {
                result.push({
                  id: sourceId,
                  status: 400,
                  value: tag,
                  message: err.message
                })
              }
            }
          }
        }
      }
    }
    return result
  }

  static async batchUpdateRemoveTags (body /*: any */) /*: Promise<any> */ {
    debug('**batchUpdateRemoveTags**')
    debug('body: ', body)
    let result = []
    for (const sourceId of body.sources) {
      const source = await Source.query()
        .findById(sourceId)
        .withGraphFetched('tags')
      if (!source) {
        result.push({
          id: sourceId,
          status: 404,
          message: `No Source found with id ${sourceId}`
        })
      } else {
        for (const tag of body.value) {
          // if tag doesn't exist for this source, skip
          if (
            !_.find(source.tags, {
              id: urlToId(tag)
            })
          ) {
            result.push({
              id: sourceId,
              status: 204,
              value: tag
            })
          } else {
            try {
              await Source_Tag.removeTagFromSourceNoError(sourceId, tag)
              result.push({
                id: sourceId,
                status: 204,
                value: tag
              })
            } catch (err) {
              result.push({
                id: sourceId,
                status: 400,
                value: tag,
                message: err.message
              })
            }
          }
        }
      }
    }
    return result
  }

  static async update (
    source /*: any */,
    body /*: any */
  ) /*: Promise<SourceType|null> */ {
    debug('**update**')
    debug('source: ', source)
    debug('body: ', body)
    const id = urlToId(source.id)
    Source._validateIncomingSource(body)

    const modifications = Source._formatIncomingSource(null, body)
    if (
      modifications.metadata &&
      Object.keys(modifications.metadata).length > 0
    ) {
      modifications.metadata = _.omitBy(modifications.metadata, _.isUndefined)
      modifications.metadata = Object.assign(
        source.metadata,
        modifications.metadata
      )
    }
    let updatedSource
    if (_.isEmpty(modifications)) {
      updatedSource = await Source.query().findById(id)
    } else {
      updatedSource = await Source.query().patchAndFetchById(id, modifications)
    }

    // attach attributions to the udpatedSource object
    if (source.attributions) {
      attributionTypes.forEach(type => {
        updatedSource[type] = source.attributions.filter(
          attribution => attribution.role === type
        )
      })
      source.attributions = undefined
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
        await Attribution.deleteAttributionOfSource(id, role)
      } else if (body[role] === null) {
        await Attribution.deleteAttributionOfSource(id, role)
        updatedSource[role] = null
      }
    }

    // Update Attributions if necessary
    const attributions = await Attribution.createAttributionsForSource(
      body,
      id,
      urlToId(updatedSource.readerId)
    )
    updatedSource = Object.assign(updatedSource, attributions)

    return updatedSource
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

module.exports = { Source }
