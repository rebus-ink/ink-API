/* @flow */
'use strict'
const assert = require('assert')
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const short = require('short-uuid')
const translator = short()
const _ = require('lodash')

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
class Activity extends BaseModel {
  static get tableName () /*: string */ {
    return 'Activity'
  }
  get path () /*: string */ {
    return 'activity'
  }

  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string', maxLength: 255 },
        readerId: { type: 'string' },
        object: { type: 'object' },
        target: { type: 'object' },
        json: {
          type: 'object'
        },
        published: { type: 'string', format: 'date-time' }
      },
      required: ['id', 'type', 'readerId']
    }
  }
  static get relationMappings () /*: any */ {
    const { Publication } = require('./Publication.js')
    const { Reader } = require('./Reader.js')
    const { Document } = require('./Document.js')
    const { Note } = require('./Note.js')
    const { Tag } = require('./Tag.js')

    assert.ok(Model)
    assert.ok(Model.BelongsToOneRelation)
    assert.ok(Reader)
    assert.ok(Document)
    assert.ok(Note)
    assert.ok(Publication)

    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Activity.readerId',
          to: 'Reader.id'
        }
      }
    }
  }

  summarize () /*: string */ {
    const past = this.pastTense
    const actor = this.reader ? this.reader.name : 'someone'
    let summary = `${actor} ${past}`
    if (this.json.location) {
      const place =
        this.json.location.name || this.json.location.nameMap
          ? this.json.location.nameMap.en
          : 'somewhere'
      summary = `${summary} at ${place}`
    }
    return summary
  }

  get pastTense () /*: string */ {
    let type /*: string */
    if (_.isString(this.type)) {
      type = this.type
    } else {
      type = 'Activity'
    }
    switch (type) {
      case 'Activity':
        return 'acted'
      case 'Flag':
        return 'flagged'
      case 'Leave':
        return 'left'
      case 'Read':
        return 'read'
      case 'TentativeReject':
        return 'tentatively rejected'
      case 'TentativeAccept':
        return 'tentatively accepted'
      case 'Undo':
        return 'undid'
      default:
        if (type.charAt(type.length - 1) === 'e') {
          return `${type.toLowerCase()}d`
        } else {
          return `${type.toLowerCase()}ed`
        }
    }
  }

  static async byId (id /*: string */) /*: Promise<activity> */ {
    return await Activity.query()
      .findById(id)
      .eager('reader')
  }

  static async createActivity (activity /*: any */) /*: Promise<activity> */ {
    const props = _.pick(activity, [
      'type',
      'object',
      'target',
      'json',
      'readerId'
    ])

    return await Activity.query()
      .insert(props)
      .returning('*')
  }
}

module.exports = { Activity }
