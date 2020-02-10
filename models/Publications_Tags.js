// @flow
const { BaseModel } = require('./BaseModel')
const { urlToId } = require('../utils/utils')

/*::
type PublicationTagType = {
  id: string,
  publicationId: string,
  tagId: string
};
*/

class Publication_Tag extends BaseModel {
  static get tableName () {
    return 'publication_tag'
  }

  static get idColumn () {
    return ['publicationId', 'tagId']
  }

  static async addTagToPub (
    publicationId /*: string */,
    tagId /*: string */
  ) /*: Promise<any> */ {
    if (!publicationId) throw new Error('no publication')
    if (!tagId) throw new Error('no tag')

    try {
      return await Publication_Tag.query().insertAndFetch({
        publicationId: publicationId,
        tagId
      })
    } catch (err) {
      if (err.constraint === 'publication_tag_tagid_foreign') {
        throw new Error('no tag')
      } else if (err.constraint === 'publication_tag_publicationid_foreign') {
        throw new Error('no publication')
      } else if (
        err.constraint === 'publication_tag_publicationid_tagid_unique'
      ) {
        throw new Error(
          `Add Tag to Publication Error: Relationship already exists between Publication ${publicationId} and Tag ${tagId}`
        )
      }
    }
  }

  static async removeTagFromPub (
    publicationId /*: string */,
    tagId /*: string */
  ) /*: Promise<PublicationTagType|Error> */ {
    const result = await Publication_Tag.query()
      .delete()
      .where({
        publicationId: urlToId(publicationId),
        tagId
      })

    if (result === 0) {
      throw new Error(
        `Remove Tag from Publication Error: No Relation found between Tag ${tagId} and Publication ${publicationId}`
      )
    } else {
      return result
    }
  }

  static async deletePubTagsOfPub (
    publicationId /*: string */
  ) /*: Promise<number|Error> */ {
    if (!publicationId) return new Error('no publication')

    return await Publication_Tag.query()
      .delete()
      .where({ publicationId: urlToId(publicationId) })
  }

  static async deletePubTagsOfTag (
    tagId /*: string */
  ) /*: Promise<number|Error> */ {
    if (!tagId) return new Error('no tag')

    return await Publication_Tag.query()
      .delete()
      .where({ tagId: urlToId(tagId) })
  }

  static async getIdsByCollection (
    tagName /*: string */,
    readerId /*: string */
  ) /*: Promise<Array<string>> */ {
    const res = await Publication_Tag.query()
      .select('publication_tag.publicationId')
      .leftJoin('Tag', 'publication_tag.tagId', '=', 'Tag.id')
      .where('Tag.name', '=', tagName)
      .andWhere('Tag.readerId', '=', urlToId(readerId))
      .andWhere('Tag.type', '=', 'stack')

    return res.map(object => urlToId(object.publicationId))
  }

  $beforeInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeInsert(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.published = undefined
      doc.id = undefined
    })
  }
}

module.exports = { Publication_Tag }
