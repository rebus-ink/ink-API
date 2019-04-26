/* @flow */
'use strict'
const assert = require('assert')
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const short = require('short-uuid')
const translator = short()
const _ = require('lodash')
const { createId, idToUrl } = require('./utils')

/*::
type activity = {
    id: string,
    type: string,
    json: {},
    object: {},
    target: {},
    readerId: string,
    published: string,
    reader: {id: string, json: any, userId: string, published: string, updated: string}
  }
*/

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
    const { Document } = require('./Document.js')
    const { Note } = require('./Note.js')
    const { Tag } = require('./Tag.js')

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

  // static async byId (id /*: string */) /*: Promise<activity> */ {
  //   return await ReaderActivity.query()
  //     .findById(id)
  //     .eager('readerActivity')
  // }

  static async createReadActivity (
    readerId /*: string */,
    publicationId /*: string */,
    object /*: any */
  ) /*: any */ {
    if (!readerId) return new Error('wrong readerId')

    if (!publicationId) return new Error('wrong publicationId')

    if (!object) return new Error('wrong object')

    const props = _.pick(object, ['selector', 'json'])

    props.id = createId()
    props.readerId = readerId
    props.publicationId = publicationId
    props.published = new Date().toISOString()

    try {
      var activity = await ReadActivity.query()
        .insert(props)
        .returning('*')

      console.log('LAST ACTIVITY INSERTED: ' + activity.id)

      return activity
    } catch (err) {
      if (err.constraint === 'readactivity_readerid_foreign') {
        return new Error('no reader')
      } else if (err.constraint === 'readactivity_publicationid_foreign') {
        return new Error('no publication')
      }
    }
  }

  static async getLatestReadActivity (publicationId /*: string */) /*: any */ {
    if (!publicationId) return new Error('wrong publicationId')

    const readActivities = await ReadActivity.query()
      .where('publicationId', '=', publicationId)
      .orderBy('published')

    return readActivities[readActivities.length - 1]
  }
}

module.exports = { ReadActivity }
