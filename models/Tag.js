// @flow
'use strict'
const { BaseModel } = require('./BaseModel')
const { Source_Tag } = require('./Source_Tag')
const { Note_Tag } = require('./Note_Tag')
const { urlToId } = require('../utils/utils')
const _ = require('lodash')
const crypto = require('crypto')
const { Reader } = require('./Reader')
const { Notebook } = require('./Notebook')
const { Model } = require('objection')

/*::
type TagType = {
  id: string,
  name: string,
  type: string,
  json?: Object,
  published: Date,
  updated: Date
};
*/

class Tag extends BaseModel {
  static get tableName () /*: string */ {
    return 'Tag'
  }
  get path () /*: string */ {
    return 'tag'
  }

  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string', maxLength: 255 },
        name: { type: 'string' },
        json: { type: 'object' },
        readerId: { type: 'string' },
        notebookId: { type: ['string', 'null'] },
        updated: { type: 'string', format: 'date-time' },
        published: { type: 'string', format: 'date-time' },
        deleted: { type: 'string', format: 'date-time' }
      },
      additionalProperties: true,
      required: ['type', 'readerId', 'name']
    }
  }

  static async createTag (
    readerId /*: string */,
    tag /*: {type: string, name: string, type: string, json?: {}, readerId?: string, notebookId?:string} */
  ) /*: Promise<any> */ {
    tag.readerId = urlToId(readerId)

    const props = _.pick(tag, ['name', 'json', 'readerId', 'notebookId'])
    props.type = tag.type
    props.id = `${urlToId(readerId)}-${crypto.randomBytes(5).toString('hex')}`
    try {
      return await Tag.query().insert(props)
    } catch (err) {
      if (err.constraint === 'tag_readerid_name_type_unique') {
        throw new Error(`Create Tag Error: Tag ${tag.name} already exists`)
      }
      throw err
    }
  }

  static async createMultipleTags (
    readerId /*: string */,
    tags /*: Array<{type: string, name: string, tagType: string, json?: {}, readerId?: string}> */
  ) /*: Promise<any> */ {
    const tagArray = tags.map(tag => {
      tag.readerId = readerId
      tag = _.pick(tag, ['name', 'json', 'readerId', 'type', 'notebookId'])
      tag.id = `${urlToId(readerId)}-${crypto.randomBytes(5).toString('hex')}`
      return tag
    })

    try {
      return await Tag.query().insert(tagArray)
    } catch (err) {
      return err
    }
  }

  async delete () /*: Promise<number> */ {
    const tagId = this.id
    // Delete all Source_Tags associated with this tag
    await Source_Tag.deleteSourceTagsOfTag(urlToId(tagId))

    // Delete all Note_Tags associated with this tag
    await Note_Tag.deleteNoteTagsOfTag(urlToId(tagId))

    try {
      return await Tag.query().deleteById(urlToId(tagId))
    } catch (err) {
      throw err
    }
  }

  // deprecated
  static async deleteTag (tagId /*: string */) /*: Promise<number|Error> */ {
    if (!tagId) return new Error('no tag')

    // Delete all Source_Tags associated with this tag
    await Source_Tag.deleteSourceTagsOfTag(urlToId(tagId))

    // Delete all Note_Tags associated with this tag
    await Note_Tag.deleteNoteTagsOfTag(urlToId(tagId))

    return await Tag.query().deleteById(urlToId(tagId))
  }

  async update (object /*: any */) /*: Promise<TagType|null> */ {
    const modifications = _.pick(object, [
      'name',
      'json',
      'readerId',
      'id',
      'type',
      'notebookId'
    ])
    try {
      return await Tag.query().updateAndFetchById(
        urlToId(this.id),
        modifications
      )
    } catch (err) {
      throw err
    }
  }

  // deprecated
  static async update (object /*: any */) /*: Promise<TagType|null> */ {
    if (!object.id) return null

    const modifications = _.pick(object, ['name', 'json'])
    let tag = await Tag.query().findById(urlToId(object.id))
    if (!tag) {
      return null
    }
    try {
      return await Tag.query().patchAndFetchById(
        urlToId(object.id),
        modifications
      )
    } catch (err) {
      return err
    }
  }

  static async byReaderId (
    readerId /*: string */
  ) /*: Promise<Array<TagType>> */ {
    return await Tag.query().where('readerId', '=', readerId)
  }

  static async byId (id /*: string */) /*: Promise<TagType> */ {
    return await Tag.query().findById(id)
  }

  $beforeInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeInsert(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.updated = new Date().toISOString()
    })
  }

  $formatJson (json /*: any */) /*: any */ {
    json = super.$formatJson(json)
    json.shortId = urlToId(json.id)
    json = _.omitBy(json, _.isNil)
    return json
  }
}

module.exports = { Tag }
