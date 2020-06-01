// @flow
const { BaseModel } = require('./BaseModel')
const { urlToId } = require('../utils/utils')

/*::
type SourceTagType = {
  id: string,
  sourceId: string,
  tagId: string
};
*/

class Source_Tag extends BaseModel {
  static get tableName () {
    return 'source_tag'
  }

  static get idColumn () {
    return ['sourceId', 'tagId']
  }

  static async addTagToSource (
    sourceId /*: string */,
    tagId /*: string */
  ) /*: Promise<any> */ {
    if (!sourceId) throw new Error('no source')
    if (!tagId) throw new Error('no tag')

    try {
      return await Source_Tag.query().insertAndFetch({
        sourceId: sourceId,
        tagId
      })
    } catch (err) {
      if (err.constraint === 'source_tag_tagid_foreign') {
        throw new Error('no tag')
      } else if (err.constraint === 'source_tag_sourceid_foreign') {
        throw new Error('no source')
      } else if (err.constraint === 'source_tag_sourceid_tagid_unique') {
        throw new Error(
          `Add Tag to Source Error: Relationship already exists between Source ${sourceId} and Tag ${tagId}`
        )
      }
    }
  }

  static async removeTagFromSource (
    sourceId /*: string */,
    tagId /*: string */
  ) /*: Promise<SourceTagType|Error> */ {
    const result = await Source_Tag.query()
      .delete()
      .where({
        sourceId: urlToId(sourceId),
        tagId
      })

    if (result === 0) {
      throw new Error(
        `Remove Tag from Source Error: No Relation found between Tag ${tagId} and Source ${sourceId}`
      )
    } else {
      return result
    }
  }

  static async removeTagFromSourceNoError (
    sourceId /*: string */,
    tagId /*: string */
  ) /*: Promise<SourceTagType|Error> */ {
    return await Source_Tag.query()
      .delete()
      .where({
        sourceId: urlToId(sourceId),
        tagId
      })
  }

  static async deleteSourceTagsOfSource (
    sourceId /*: string */
  ) /*: Promise<number|Error> */ {
    if (!sourceId) return new Error('no source')

    return await Source_Tag.query()
      .delete()
      .where({ sourceId: urlToId(sourceId) })
  }

  static async deleteSourceTagsOfTag (
    tagId /*: string */
  ) /*: Promise<number|Error> */ {
    if (!tagId) return new Error('no tag')

    return await Source_Tag.query()
      .delete()
      .where({ tagId: urlToId(tagId) })
  }

  static async getIdsByCollection (
    tagName /*: string */,
    readerId /*: string */
  ) /*: Promise<Array<string>> */ {
    const res = await Source_Tag.query()
      .select('source_tag.sourceId')
      .leftJoin('Tag', 'source_tag.tagId', '=', 'Tag.id')
      .where('Tag.name', '=', tagName)
      .andWhere('Tag.readerId', '=', urlToId(readerId))
      .andWhere('Tag.type', '=', 'stack')

    return res.map(object => urlToId(object.sourceId))
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

module.exports = { Source_Tag }
