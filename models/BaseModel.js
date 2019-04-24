// @flow
'use strict'
const { Model } = require('objection')
const { DbErrors } = require('objection-db-errors')
const guid = require('objection-guid')()
const short = require('short-uuid')
const translator = short()
const { getId } = require('../utils/get-id.js')
const arrify = require('arrify')
const lodash = require('lodash')
const URL = require('url').URL
const debug = require('debug')('hobb:model:base-model')
const _ = require('lodash')
const { urlToId } = require('../routes/utils')

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
    const parent = super.$beforeUpdate(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc = doc.formatIdsToUrl(doc, doc.getType())
    })
  }

  $afterInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeUpdate(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc = doc.formatIdsToUrl(doc, doc.getType())
    })
  }

  $beforeInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeUpdate(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.id = urlToId(doc.id)
      doc.readerId = urlToId(doc.readerId)
      doc.publicationId = urlToId(doc.publicationId)
      doc.documentId = urlToId(doc.documentId)
    })
  }

  $beforeUpdate (queryOptions /*: any */, context /*: any */) {
    const parent = super.$beforeUpdate(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.id = urlToId(doc.id)
      doc.readerId = urlToId(doc.readerId)
      doc.publicationId = urlToId(doc.publicationId)
      doc.documentId = urlToId(doc.documentId)
    })
  }

  getType () /*: ?string */ {
    const tables = ['Activity', 'Publication', 'Reader', 'Note', 'ReadActivity']

    if (_.indexOf(tables, this.constructor.name) > -1) {
      return this.constructor.name.toLowerCase()
    } else {
      return undefined
    }
  }

  //   static get jsonAttributes () /*: Array<string> */ {
  //     return ['json', 'properties']
  //   }
  //   get shortId () /*: string */ {
  //     return translator.fromUUID(this.id)
  //   }
  //   hasName () /*: string */ {
  //     return (
  //       this.json.name ||
  //       this.json.nameMap ||
  //       this.json.summary ||
  //       this.json.summaryMap
  //     )
  //   }
  //   summarize () /*: string */ {
  //     let type /*: string */
  //     if (_.isString(this.type)) {
  //       type = this.type.toLowerCase()
  //     } else if (_.isString(this.json.type)) {
  //       type = this.json.type.toLowerCase()
  //     } else {
  //       type = 'object'
  //     }
  //     return `${type} with id ${this.id}`
  //   }
  //   $beforeUpdate (
  //     queryOptions /*: any */,
  //     context /*: any */
  //   ) /*: Promise<any> */ {
  //     const parent = super.$beforeUpdate(queryOptions, context)
  //     const doc = this
  //     return Promise.resolve(parent).then(function () {
  //       doc.updated = new Date().toISOString()
  //     })
  //   }
  //   // $parseJson (json /*: any */, opt /*: any */) /*: any */ {
  //   //   json = super.$parseJson(json, opt)
  //   //   // Need to discover id, readerId, canonicalId
  //   //   const id = getUUID(json.id)
  //   //   let readerId
  //   //   if (json.bto) {
  //   //     readerId = getUUID(json.bto)
  //   //   } else {
  //   //     readerId = getUUID(json.actor)
  //   //     json.bto = json.actor
  //   //   }
  //   //   const canonicalId = getCanonical(json.url)
  //   //   const { userId, inReplyTo, context, deleted } = json
  //   //   // Should get the inReplyTo document id, much like context
  //   //   const publicationId = getUUID(context)
  //   //   const documentId = getUUID(inReplyTo)
  //   //   const activityRelation = objectToId(json.object)
  //   //   const { attachment, outbox, tag, replies, attributedTo } = addReaderToGraph(
  //   //     json
  //   //   )
  //   //   delete json.bto
  //   //   delete json.attachment
  //   //   delete json.replies
  //   //   delete json.attributedTo
  //   //   return stripUndefined(
  //   //     Object.assign(
  //   //       {
  //   //         id,
  //   //         readerId,
  //   //         canonicalId,
  //   //         userId,
  //   //         json,
  //   //         attachment,
  //   //         outbox,
  //   //         tag,
  //   //         replies,
  //   //         attributedTo,
  //   //         publicationId,
  //   //         documentId,
  //   //         deleted
  //   //       },
  //   //       activityRelation
  //   //     )
  //   //   )
  //   // }
  //   $formatJson (json /*: any */) {
  //     const original = super.$formatJson(json)
  //     json = original.json || {}
  //     const {
  //       url: id,
  //       published,
  //       updated,
  //       attachment,
  //       tags,
  //       context = {},
  //       attributedTo = []
  //     } = original
  //     json.context = context.id
  //     return Object.assign(json, {
  //       id,
  //       published,
  //       updated,
  //       tags,
  //       attachment,
  //       attributedTo
  //     })
  //   }
  // }
  // function getUUID (prop /*: string */) /*: ?string */ {
  //   try {
  //     const id = getIdURL(prop)
  //     const pathname = new URL(id).pathname
  //     const shortId = pathname.split('-')[1]
  //     return translator.toUUID(shortId)
  //   } catch (err) {
  //     /* should we throw? */
  //   }
  // }
  // function getCanonical (urls /*: Array<string> */ = []) /*: Array<string> */ {
  //   urls = arrify(urls)
  //   const link = urls.filter(item => item.rel === 'canonical')
  //   return lodash.get(link, '0.href')
  // }
  // function stripUndefined (json /*: any */) /*: any */ {
  //   return lodash.omitBy(json, lodash.isUndefined)
  // }
  // function getIdURL (idOrObject /*: any */) {
  //   // not able to type the return value, but it will be a string
  //   if (lodash.isObject(idOrObject)) {
  //     return idOrObject.id
  //   } else {
  //     return idOrObject
  //   }
  // }
  // function objectToId (obj /*: any */) /*: any */ {
  //   const id = getUUID(obj)
  //   const url = getIdURL(obj)
  //   let type /*: string */
  //   try {
  //     const pathname = url.replace(process.env.DOMAIN, '')
  //     type = pathname.split('-')[0].slice(1)
  //   } catch (err) {
  //     return undefined
  //   }
  //   return { [type + 'Id']: id }
  // }
  // function addReaderToGraph (
  //   json /*: any */
  // ) /*: {
  //   attachment: any,
  //   outbox: any,
  //   tag: any,
  //   replies: any,
  //   attributedTo: any
  // } */ {
  //   const bto = json.bto
  //   const props = ['attachment', 'outbox', 'tag', 'replies', 'attributedTo']
  //   const result = {}
  //   props.forEach(prop => {
  //     if (json[prop]) {
  //       debug(prop)
  //       result[prop] = json[prop].map(item => {
  //         item.bto = bto
  //         return item
  //       })
  //     }
  //   })
  //   return result
}

module.exports = {
  BaseModel
}
