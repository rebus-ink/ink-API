// @flow
'use strict'
const { Model } = require('objection')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')

const domain = process.env.DOMAIN || ''

/**
 * @property {string} id - the current object's id or url
 * @property {string} shortId - the current object's short id (used in the url)
 * @property {Date} published - publishing date
 * @property {Date} updated - date of update
 *
 * The base model for most of the other models. Implements url, shortId, published, and updated.
 */
class BaseModel extends Model {
  formatIdsToUrl (json /*: any */, type /* :?string */) /*: any */ {
    if (
      type === 'source' &&
      json.id &&
      !json.id.startsWith(process.env.DOMAIN)
    ) {
      json.id = `${domain}/sources/${json.id}`
    } else if (
      type === 'reader' &&
      json.id &&
      !json.id.startsWith(process.env.DOMAIN)
    ) {
      json.id = `${domain}/readers/${json.id}`
    } else if (
      type === 'note' &&
      json.id &&
      !json.id.startsWith(process.env.DOMAIN)
    ) {
      json.id = `${domain}/notes/${json.id}`
    } else if (
      type === 'notecontext' &&
      json.id &&
      !json.id.startsWith(process.env.DOMAIN)
    ) {
      json.id = `${domain}/noteContexts/${json.id}`
    } else if (
      type === 'notebook' &&
      json.id &&
      !json.id.startsWith(process.env.DOMAIN)
    ) {
      json.id = `${domain}/notebooks/${json.id}`
    }
    if (json.readerId && !json.readerId.startsWith(process.env.DOMAIN)) {
      json.readerId = `${domain}/readers/${json.readerId}`
    }

    if (json.sourceId && !json.sourceId.startsWith(process.env.DOMAIN)) {
      json.sourceId = `${domain}/sources/${json.sourceId}`
    }

    if (json.noteId && !json.noteId.startsWith(process.env.DOMAIN)) {
      json.noteId = `${domain}/notes/${json.noteId}`
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
      if (!doc.id) doc.id = crypto.randomBytes(16).toString('hex')
      const time = new Date().toISOString()
      doc.published = time
      doc.readerId = urlToId(doc.readerId)
      doc.sourceId = urlToId(doc.sourceId)
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
      doc.sourceId = urlToId(doc.sourceId)

      Object.keys(doc).forEach(
        key => (doc[key] === undefined ? delete doc[key] : '')
      )
    })
  }

  getType () /*: ?string */ {
    const tables = [
      'Source',
      'Reader',
      'Note',
      'ReadActivity',
      'NoteContext',
      'Notebook'
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
