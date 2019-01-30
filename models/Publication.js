'use strict'
const Model = require('objection').Model
const { BaseModel } = require('./BaseModel.js')
const short = require('short-uuid')
const translator = short()
const _ = require('lodash')

/**
 * @property {Reader} reader - Returns the reader that owns this publication.
 * @property {Document[]} attachment - Returns the documents attached to this publication.
 * @property {Note[]} replies - Returns the notes associated with this publication.
 * @property {Activity[]} outbox - Returns the activities on this publication. **Question** how should a publication reference its activities?
 * @property {Attribution[]} attributedTo - returns the `Attribution` objects (can be many) attributed with contributing to or creating this document.
 * @property {Tag[]} tag - Returns the publication's `Tag` objects (i.e. links, hashtags, stacks and categories).
 *
 * This class represents an individual publication and holds references to the documents it contains, its creators/contributors, the notes on both the documents and publication itself, the reader who owns it, and the tags used to group it (and its contents) with other publications.
 */
class Publication extends BaseModel {
  static get tableName () /*: string */ {
    return 'Publication'
  }
  get path () /*: string */ {
    return 'publication'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', maxLength: 255 },
        readerId: { type: 'string', format: 'uuid', maxLength: 255 },
        json: {
          type: 'object',
          properties: {
            type: { const: 'reader:Publication' }
          },
          additionalProperties: true
        },
        updated: { type: 'string', format: 'date-time' },
        published: { type: 'string', format: 'date-time' }
      },
      additionalProperties: true,
      required: ['json']
    }
  }
  static get relationMappings () /*: any */ {
    const { Reader } = require('./Reader')
    const { Document } = require('./Document.js')
    const { Note } = require('./Note.js')
    const { Activity } = require('./Activity.js')
    const { Attribution } = require('./Attribution.js')
    const { Tag } = require('./Tag.js')
    return {
      reader: {
        relation: Model.BelongsToOneRelation,
        modelClass: Reader,
        join: {
          from: 'Publication.readerId',
          to: 'Reader.id'
        }
      },
      outbox: {
        relation: Model.HasManyRelation,
        modelClass: Activity,
        join: {
          from: 'Publication.id',
          to: 'Activity.publicationId'
        }
      },
      attributedTo: {
        relation: Model.HasManyRelation,
        modelClass: Attribution,
        join: {
          from: 'Publication.id',
          to: 'Attribution.publicationId'
        }
      },
      replies: {
        relation: Model.HasManyRelation,
        modelClass: Note,
        join: {
          from: 'Publication.id',
          to: 'Note.publicationId'
        }
      },
      attachment: {
        relation: Model.HasManyRelation,
        modelClass: Document,
        join: {
          from: 'Publication.id',
          to: 'Document.publicationId'
        }
      }
      // tag: {
      //   relation: Model.HasManyRelation,
      //   modelClass: Tag,
      //   join: {
      //     from: 'Publication.id',
      //     to: 'Tag.publicationId'
      //   }
      // }
    }
  }

  asRef () /*: {
    type: string,
    id: string,
    name: ?string,
    attributedTo: {
      type: string,
      name: ?string
    }
  } */ {
    const author = this.attributedTo || this.json.attributedTo || null
    return {
      type: 'reader:Publication',
      id: this.url,
      name: this.name || this.json.name || null,
      attributedTo: {
        type: 'Person',
        name: author ? author.name : null
      }
    }
  }

  static async byShortId (
    shortId /*: string */
  ) /*: Promise<{
    id: string,
    description: ?string,
    json: {
      attachment: Array<{
        type: string,
        content: string
      }>,
      id: string,
      desription: ?string,
      summaryMap: {en: string}
    },
    readerId: string,
    published: string,
    updated: string,
    reader: {
      id: string,
      json: any,
      userId: string,
      published: string,
      updated: string
    }
  }> */ {
    return Publication.query()
      .findById(translator.toUUID(shortId))
      .eager('[reader, attachment, replies]')
  }

  $formatJson (json /*: any */) /*: any */ {
    json = super.$formatJson(json)
    let attachment = null
    if (this.attachment) {
      attachment = _.sortBy(
        this.attachment.filter(
          doc => doc.json.position || doc.json.position === 0
        ),
        'json.position'
      )
    }
    return Object.assign(json, {
      orderedItems: attachment
    })
  }
}

module.exports = { Publication }
