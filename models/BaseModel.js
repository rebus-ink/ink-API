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
const arrify = require('arrify')
const lodash = require('lodash')
const URL = require('url').URL
const debug = require('debug')('hobb:model:base-model')
const _ = require('lodash')

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
      if (!doc.hasName()) {
        doc.json.summaryMap = {
          en: doc.summarize()
        }
      }
    })
  }

  hasName () {
    return (
      this.json.name ||
      this.json.nameMap ||
      this.json.summary ||
      this.json.summaryMap
    )
  }

  summarize () {
    let type
    if (_.isString(this.type)) {
      type = this.type.toLowerCase()
    } else if (_.isString(this.json.type)) {
      type = this.json.type.toLowerCase()
    } else {
      type = 'object'
    }
    return `${type} with id ${this.id}`
  }

  $beforeUpdate (queryOptions /*: any */, context /*: any */) {
    const parent = super.$beforeUpdate(queryOptions, context)
    const doc = this
    return Promise.resolve(parent).then(function () {
      doc.updated = new Date().toISOString()
    })
  }

  $parseJson (json /*: any */, opt /*: any */) {
    json = super.$parseJson(json, opt)
    // Need to discover id, readerId, canonicalId
    const id = getUUID(json.id)
    let readerId
    if (json.bto) {
      readerId = getUUID(json.bto)
    } else {
      readerId = getUUID(json.actor)
      json.bto = json.actor
    }
    const canonicalId = getCanonical(json.url)
    const { userId, inReplyTo, context } = json
    // Should get the inReplyTo document id, much like context
    const publicationId = getUUID(context)
    const documentId = getUUID(inReplyTo)
    const activityRelation = objectToId(json.object)
    const { attachment, outbox, tag, replies, attributedTo } = addReaderToGraph(
      json
    )
    delete json.bto
    return stripUndefined(
      Object.assign(
        {
          id,
          readerId,
          canonicalId,
          userId,
          json,
          attachment,
          outbox,
          tag,
          replies,
          attributedTo,
          publicationId,
          documentId
        },
        activityRelation
      )
    )
  }

  $formatJson (json /*: any */) {
    const original = super.$formatJson(json)
    json = original.json || {}
    const {
      url: id,
      published,
      updated,
      attachment,
      context = {},
      attributedTo = []
    } = original
    json.context = context.id
    return Object.assign(json, {
      id,
      published,
      updated,
      attachment,
      attributedTo
    })
  }
}

function getUUID (prop /*: string */) {
  try {
    const id = getIdURL(prop)
    const pathname = new URL(id).pathname
    const shortId = pathname.split('-')[1]
    return translator.toUUID(shortId)
  } catch (err) {}
}

function getCanonical (urls = []) {
  urls = arrify(urls)
  const link = urls.filter(item => item.rel === 'canonical')
  return lodash.get(link, '0.href')
}

function stripUndefined (json) {
  return lodash.omitBy(json, lodash.isUndefined)
}

function getIdURL (idOrObject /*: any */) {
  if (lodash.isObject(idOrObject)) {
    return idOrObject.id
  } else {
    return idOrObject
  }
}

function objectToId (obj) {
  const id = getUUID(obj)
  const url = getIdURL(obj)
  let type
  try {
    const pathname = new URL(url).pathname
    type = pathname.split('-')[0]
  } catch (err) {
    return undefined
  }
  return { [type + 'Id']: id }
}

function addReaderToGraph (json) {
  const bto = json.bto
  const props = ['attachment', 'outbox', 'tag', 'replies', 'attributedTo']
  const result = {}
  props.forEach(prop => {
    if (json[prop]) {
      debug(prop)
      result[prop] = json[prop].map(item => {
        item.bto = bto
        return item
      })
    }
  })
  return result
}

module.exports = {
  BaseModel
}
