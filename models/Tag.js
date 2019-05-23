// @flow
'use strict'
const { BaseModel } = require('./BaseModel')
const _ = require('lodash')

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

  static async createTag (
    readerId /*: string */,
    tag /*: {type: string, name: string, json?: {}, readerId?: string} */
  ) /*: Promise<any> */ {
    tag.readerId = readerId

    // reject duplicates TODO: enforce this as the database level?
    const existing = await Tag.query().where({
      readerId: tag.readerId,
      type: tag.type,
      name: tag.name
    })
    if (existing.length > 0) return new Error('duplicate')

    const props = _.pick(tag, ['name', 'type', 'json', 'readerId'])

    try {
      return await Tag.query().insert(props)
    } catch (err) {
      if (err.constraint === 'tag_readerid_name_type_unique') {
        return new Error('duplicate')
      }
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
}

module.exports = { Tag }
