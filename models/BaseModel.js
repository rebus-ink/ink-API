// @flow
'use strict'
const { Model } = require('objection')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')

const domain = process.env.DOMAIN || ''

/**
 * @property {string} url - the current object's url
 * @property {string} shortId - the current object's short id (used in the url)
 * @property {Date} published - publishing date
 * @property {Date} updated - date of update
 *
 * The base model for most of the other models. Implements url, shortId, published, and updated.
 */
class BaseModel extends Model {
  /**
   *
   * @param {object} json
   * @param {string?} type
   */
  formatIdsToUrl (json /*: any */, type /* :?string */) /*: any */ {
    if (type && json.id && !json.id.startsWith(process.env.DOMAIN)) {
      json.id = `${domain}/${type}-${json.id}`
    }
    if (json.readerId && !json.readerId.startsWith(process.env.DOMAIN)) {
      json.readerId = `${domain}/reader-${json.readerId}`
    }

    if (
      json.publicationId &&
      !json.publicationId.startsWith(process.env.DOMAIN)
    ) {
      json.publicationId = `${domain}/publication-${json.publicationId}`
    }

    if (json.noteId && !json.noteId.startsWith(process.env.DOMAIN)) {
      json.noteId = `${domain}/note-${json.noteId}`
    }

    return json
  }

  $afterGet (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$afterGet(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc = doc.formatIdsToUrl(doc, doc.getType())
    })
  }

  $afterInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$afterInsert(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc = doc.formatIdsToUrl(doc, doc.getType())
    })
  }

  $beforeInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeInsert(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.id = crypto.randomBytes(16).toString('hex')
      const time = new Date().toISOString()
      doc.published = time
      doc.readerId = urlToId(doc.readerId)
      doc.publicationId = urlToId(doc.publicationId)
      doc.documentId = urlToId(doc.documentId)
      doc.tagId = urlToId(doc.tagId)

      Object.keys(doc).forEach(
        key => (doc[key] === undefined ? delete doc[key] : '')
      )
    })
  }

  $beforeUpdate (queryOptions /*: any */, context /*: any */) {
    const parent = super.$beforeUpdate(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.id = urlToId(doc.id)
      doc.updated = new Date().toISOString()
      doc.readerId = urlToId(doc.readerId)
      doc.publicationId = urlToId(doc.publicationId)
      doc.documentId = urlToId(doc.documentId)

      Object.keys(doc).forEach(
        key => (doc[key] === undefined ? delete doc[key] : '')
      )
    })
  }

  getType () /*: ?string */ {
    const tables = [
      'Activity',
      'Publication',
      'Reader',
      'Note',
      'ReadActivity',
      'Job'
    ]

    if (_.indexOf(tables, this.constructor.name) > -1) {
      return this.constructor.name.toLowerCase()
    } else {
      return undefined
    }
  }
}

module.exports = {
  BaseModel
}
