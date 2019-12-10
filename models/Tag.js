// @flow
'use strict'
const { BaseModel } = require('./BaseModel')
const { Publication_Tag } = require('./Publications_Tags')
const { Note_Tag } = require('./Note_Tag')
const { urlToId } = require('../utils/utils')
const _ = require('lodash')
const crypto = require('crypto')

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

/**
 * @property {Document} document - returns the document, if any, that this tag is a property of.
 * @property {Publication} publication - returns the publication, if any, that this tag is a property of.
 * @property {Note} note - returns the note, if any, that this tag is a property of.
 * @property {Reader} reader - returns the owning reader.
 *
 * This is a slightly generic link model. Conceptually, this is a link from the document or publication to a URL. These links can have types such as as:HashTag, reader:Stack, or Mention. (Mentions are used to list out characters and people who are mentioned in the text.)
 *
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
    tag /*: {type: string, name: string, tagType: string, json?: {}, readerId?: string} */
  ) /*: Promise<any> */ {
    tag.readerId = readerId
    // reject duplicates TODO: enforce this as the database level?
    //   if (tag.name) {
    //   console.log(tag.type, tag.name)
    //   const existing = await Tag.query().where({
    //     readerId: tag.readerId,
    //     type: tag.type,
    //     name: tag.name
    //   })
    //   console.log(existing)
    //   if (existing.length > 0) return new Error('duplicate')
    // }
    const props = _.pick(tag, ['name', 'json', 'readerId'])
    props.type = tag.tagType
    props.id = `${urlToId(readerId)}-${crypto.randomBytes(5).toString('hex')}`

    try {
      return await Tag.query().insert(props)
    } catch (err) {
      if (err.constraint === 'tag_readerid_name_type_unique') {
        return new Error('duplicate')
      }
      return err
    }
  }

  static async deleteTag (tagId /*: string */) /*: Promise<number|Error> */ {
    if (!tagId) return new Error('no tag')

    // Delete all Publication_Tags associated with this tag
    await Publication_Tag.deletePubTagsOfTag(urlToId(tagId))

    // Delete all Note_Tags associated with this tag
    await Note_Tag.deleteNoteTagsOfTag(urlToId(tagId))

    return await Tag.query().deleteById(urlToId(tagId))
  }

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
    json.tagType = json.type
    json.type = 'reader:Tag'
    return json
  }
}

module.exports = { Tag }
