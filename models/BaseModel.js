// @flow
'use strict'
const { Model } = require('objection')
const { DbErrors } = require('objection-db-errors')
const guid = require('objection-guid')({
  field: 'id'
})
const short = require('short-uuid')
const translator = short()
const { getId } = require('../utils/get-id.js')

/**
 * @property {string} url - the current object's url
 * @property {string} shortId - the current object's short id (used in the url)
 * @property {Date} published - publishing date
 * @property {Date} updated - date of update
 *
 * The base model for most of the other models. Implements url, shortId, published, and updated.
 */
class BaseModel extends guid(DbErrors(Model)) {
  static get jsonAttributes () {
    return ['json', 'properties']
  }
  static get virtualAttributes () {
    return ['url']
  }
  get url () {
    return getId(`/${this.path}-${this.shortId}`)
  }
  get shortId () {
    return translator.fromUUID(this.id)
  }
  $beforeInsert (context /*: any */) {
    const parent = super.$beforeInsert(context)
    const doc = this
    return Promise.resolve(parent).then(function () {
      doc.published = new Date().toISOString()
    })
  }
  $beforeUpdate (queryOptions /*: any */, context /*: any */) {
    const parent = super.$beforeUpdate(queryOptions, context)
    const doc = this
    return Promise.resolve(parent).then(function () {
      doc.updated = new Date().toISOString()
    })
  }
  $formatJson (json /*: any */) {
    const original = super.$formatJson(json)
    json = original.json || {}
    json.id = original.url
    json.published = original.published
    json.updated = original.updated
    if (original.attachment) {
      json.attachment = original.attachment
    }
    if (this.publication) {
      json.context = this.publication.url
    }
    return json
  }
}

module.exports = {
  BaseModel
}
