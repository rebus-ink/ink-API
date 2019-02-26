// @flow
'use strict'
const { Model } = require('objection')

/**
 * @property {Document} document - returns the document, if any, that this tag is a property of.
 * @property {Publication} publication - returns the publication, if any, that this tag is a property of.
 * @property {Note} note - returns the note, if any, that this tag is a property of.
 * @property {Reader} reader - returns the owning reader.
 *
 * This is a slightly generic link model. Conceptually, this is a link from the document or publication to a URL. These links can have types such as as:HashTag, reader:Stack, or Mention. (Mentions are used to list out characters and people who are mentioned in the text.)
 *
 */
class Tag extends Model {
  static get tableName () /*: string */ {
    return 'Tag'
  }
  get path () /*: string */ {
    return 'tag'
  }

  static async createTag (
    readerId /*: string */,
    tag /*: {type: string, name: string, readerId: ?string} */
  ) /*: any */ {
    tag.readerId = readerId
    // reject duplicates
    const existing = await Tag.query().where({
      readerId: tag.readerId,
      type: tag.type,
      name: tag.name
    })
    if (existing.length > 0) return new Error('duplicate')
    return await Tag.query().insert(tag)
  }

  static async byId (id /*: string */) /*: any */ {
    return await Tag.query().findById(id)
  }
}

module.exports = { Tag }
