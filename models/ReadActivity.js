/* @flow */
'use strict'
const assert = require('assert')
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const short = require('short-uuid')
const translator = short()
const _ = require('lodash')
const { createId, idToUrl } = require('./utils')

/**
 *
 * @property {Reader} reader - returns the reader that owns this activity. This is the 'actor' in the activity streams sense
 *
 * @property {Document} document - Returns the document, if any, that was acted upon.
 *
 * @property {Note} note - Returns the note, if any, that was acted upon.
 *
 * @property {Publication} publication - Returns the publication, if any, that was acted upon.
 *
 * `Activity` models the stored activities themselves. `Add`, `Create`, `Remove`, `Undo`, `Redo`, `Update`, and `Read` activities are all stored. `Read` is unique in that it models a _client-side_ not servers side activity. (May add `View` at a later date if needed.)
 *
 * The document, note, and publication fields on the `relationMappings` property are not exclusive. You can have an activity on a document, with no note or publication. And you can have an activity that is the addition of a note to a document in the context of a publication.
 */
class ReadActivity extends BaseModel {
  static get tableName () /*: string */ {
    return 'readActivity'
  }

  get path () /*: string */ {
    return 'readActivity'
  }

  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        selector: { type: 'object' },
        json: { type: 'object' },
        readerId: { type: 'string' },
        publicationIn: { type: 'string' },
        published: { type: 'string', format: 'date-time' }
      },
      required: ['readerId', 'publicationId']
    }
  }

  static get relationMappings () /*: any */ {
    const { Publication } = require('./Publication.js')
    const { Reader } = require('./Reader.js')

    /*
    assert.ok(Model)
    assert.ok(Model.BelongsToOneRelation)
    assert.ok(Reader)
    assert.ok(Document)
    assert.ok(Note)
    assert.ok(Publication)
    */
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'readActivity.readerId',
          to: 'Reader.id'
        }
      },
      publication: {
        relation: Model.BelongsToOneRelation,
        modelClass: Publication,
        join: {
          from: 'readActivity.publicationId',
          to: 'Publication.id'
        }
      }
    }
  }

  static async createReadActivity (
    readerId /*: string */,
    publicationId /*: string */,
    object /*: any */
  ) /*: any */ {
    if (!readerId) return new Error('missing readerId')

    if (!publicationId) return new Error('missing publicationId')

    if (!object) return new Error('missing object')

    const props = _.pick(object, ['selector', 'json'])

    props.id = createId()
    props.readerId = readerId
    props.publicationId = publicationId
    props.published = new Date().toISOString()

    try {
      return await ReadActivity.query()
        .insert(props)
        .returning('*')
    } catch (err) {
      if (err.constraint === 'readactivity_readerid_foreign') {
        return new Error('no reader')
      } else if (err.constraint === 'readactivity_publicationid_foreign') {
        return new Error('no publication')
      }
    }
  }

  static async getLatestReadActivity (publicationId /*: string */) /*: any */ {
    if (!publicationId) return new Error('missing publicationId')

    const readActivities = await ReadActivity.query()
      .where('publicationId', '=', publicationId)
      .orderBy('published', 'desc')
      .limit(1)

    /*
    const readActivities = await ReadActivity.query()
      .max('published')
      .select('*')
      .where('publicationId', '=', publicationId)
      .groupBy('publicationId')
      .groupBy('id')
    */

    for (var i = 0; i < readActivities.length; i++) {
      console.log('pub date: ' + readActivities[i].published)
    }

    /*
      .column(['readActivity.id', 'readerId', 'publicationId', 'selector', 'json' ])
      .where('publicationId', '=', publicationId)
      .groupBy('publicationId')
      .groupBy('readActivity.id')
    */

    console.log('readActivities is array: ' + readActivities.length)
    console.log('PUBDATE : ' + readActivities[0].published)
    console.log('ID: ' + readActivities[0].id)
    console.log('READER ID: ' + readActivities[0].id)
    return readActivities[0]
  }
}

module.exports = { ReadActivity }
