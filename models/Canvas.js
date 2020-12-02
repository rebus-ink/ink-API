// @flow
'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const _ = require('lodash')
const { urlToId } = require('../utils/utils')
const crypto = require('crypto')
const { Notebook } = require('./Notebook.js')
const debug = require('debug')('ink:models:Canvas')

class Canvas extends BaseModel {
  static get tableName () /*: string */ {
    return 'Canvas'
  }
  get path () /*: string */ {
    return 'canvas'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: ['string', 'null'] },
        description: { type: ['string', 'null'] },
        settings: { type: ['object', 'null'] },
        json: { type: ['object', 'null'] },
        readerId: { type: 'string' },
        notebookId: { type: ['string', 'null'] },
        published: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' }
      },
      required: ['readerId', 'notebookId']
    }
  }
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')
    const { NoteContext } = require('./NoteContext')

    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Canvas.readerId',
          to: 'Reader.id'
        }
      },
      notebook: {
        relation: Model.BelongsToOneRelation,
        modelClass: Notebook,
        join: {
          from: 'Canvas.notebookId',
          to: 'Notebook.id'
        }
      },
      noteContexts: {
        relation: Model.HasManyRelation,
        modelClass: NoteContext,
        join: {
          from: 'Canvas.id',
          to: 'NoteContext.canvasId'
        }
      }
    }
  }

  static async createCanvas (
    object /*: any */,
    readerId /*: string */
  ) /*: Promise<any> */ {
    debug('**createCanvas**')
    debug('incoming canvas object: ', object)
    debug('readerId', readerId)
    const props = _.pick(object, [
      'name',
      'description',
      'json',
      'settings',
      'notebookId'
    ])
    props.readerId = readerId
    props.id = `${urlToId(readerId)}-${crypto.randomBytes(5).toString('hex')}`
    debug('canvas to add to database: ', props)
    let result
    try {
      result = await Canvas.query().insertAndFetch(props)
    } catch (err) {
      if (err.constraint === 'canvas_notebookid_foreign') {
        throw new Error(
          `Canvas creation error: No Notebook found with id ${props.notebookId}`
        )
      }
      throw err
    }
    return result
  }

  static async byId (id /*: string */) /*: Promise<any> */ {
    debug('**byId**')
    debug('id: ', id)
    const canvas = await Canvas.query()
      .findById(id)
      .withGraphFetched('[noteContexts(notDeleted), notebook, reader]')
      .modifiers({
        notDeleted (builder) {
          builder.whereNull('deleted')
        }
      })
    debug('canvas retrieved: ', canvas)
    return canvas
  }

  static async update (object /*: any */) /*: Promise<any> */ {
    debug('**update**')
    debug('incoming object: ', object)
    const props = _.pick(object, [
      'readerId',
      'name',
      'description',
      'json',
      'settings',
      'notebookId'
    ])
    debug('props passed to database: ', props)
    if (props.notebookId === null) {
      throw new Error(
        'Validation Error on Update Canvas: notebookId is a required property'
      )
    }
    return await Canvas.query().updateAndFetchById(object.id, props)
  }

  static async delete (id /*: string */) /*: Promise<any> */ {
    debug('**delete**')
    debug('id: ', id)
    return await Canvas.query().deleteById(id)
  }

  static async applyFilters (query /*: any */, filters /*: any */) {
    debug('**applyFilters**')
    debug('filters: ', filters)

    if (filters.notebook) {
      query = query.where('notebookId', '=', urlToId(filters.notebook))
    }

    return await query
  }

  static async byReader (
    id /*: string */,
    filters /*: any */
  ) /*: Promise<Array<any>> */ {
    debug('**byReader**')

    let query = Canvas.query()
      .where('readerId', '=', id)
      .whereNull('deleted')
      .withGraphFetched('[noteContexts(notDeleted), notebook, reader]')
      .modifiers({
        notDeleted (builder) {
          builder.whereNull('deleted')
        }
      })

    this.applyFilters(query, filters)

    return await query
  }

  $beforeInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeInsert(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.updated = doc.published
    })
  }

  $formatJson (json /*: any */) /*: any */ {
    json = super.$formatJson(json)
    json.shortId = urlToId(json.id)
    json = _.omitBy(json, _.isNil)

    return json
  }
}

module.exports = { Canvas }
