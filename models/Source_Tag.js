// @flow
const { BaseModel } = require('./BaseModel')
const { urlToId } = require('../utils/utils')
const debug = require('debug')('ink:models:Source_Tag')

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
    debug('**addTagToSource**')
    debug('sourceId: ', sourceId)
    debug('tagId: ', tagId)
    if (!sourceId) throw new Error('no source')
    if (!tagId) throw new Error('no tag')

    try {
      return await Source_Tag.query().insertAndFetch({
        sourceId: sourceId,
        tagId
      })
    } catch (err) {
      debug('error: ', err.message)
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
    debug('**removeTagFromSource**')
    debug('sourceId: ', sourceId)
    debug('tagId: ', tagId)
    const result = await Source_Tag.query()
      .delete()
      .where({
        sourceId: urlToId(sourceId),
        tagId
      })
    debug('result: ', result)
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
    debug('**removeTagFromSourceNoError**')
    debug('sourceId: ', sourceId)
    debug('tagId: ', tagId)
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
    debug('**deleteSourceTagsOfSource**')
    debug('sourceId: ', sourceId)
    if (!sourceId) return new Error('no source')

    return await Source_Tag.query()
      .delete()
      .where({ sourceId: urlToId(sourceId) })
  }

  static async deleteSourceTagsOfTag (
    tagId /*: string */
  ) /*: Promise<number|Error> */ {
    debug('**deleteSourceTagsOfTag')
    debug('tagId: ', tagId)
    if (!tagId) return new Error('no tag')

    return await Source_Tag.query()
      .delete()
      .where({ tagId: urlToId(tagId) })
  }

  static async getIdsByCollection (
    tagName /*: string */,
    readerId /*: string */
  ) /*: Promise<Array<string>> */ {
    debug('**getIdsByCollection**')
    debug('tagName: ', tagName)
    debug('readerId: ', readerId)
    const res = await Source_Tag.query()
      .select('source_tag.sourceId')
      .leftJoin('Tag', 'source_tag.tagId', '=', 'Tag.id')
      .where('Tag.name', '=', tagName)
      .andWhere('Tag.readerId', '=', urlToId(readerId))
      .andWhere('Tag.type', '=', 'stack')

    return res.map(object => urlToId(object.sourceId))
  }

  /**
   * warning: does not throw errors
   */
  static async addMultipleTagsToSource (
    sourceId /*: string */,
    tags /*: Array<string> */
  ) {
    const list = tags.map(tag => {
      return { sourceId, tagId: tag }
    })

    // ignores errors - if errors encountered with first insert, insert one by one
    try {
      await Source_Tag.query().insert(list)
    } catch (err) {
      // if inserting all at once failed, insert one at a time and ignore errors
      list.forEach(async item => {
        try {
          await Source_Tag.query().insert(item)
        } catch (err2) {
          // eslint-disable-next-line
          return
        }
      })
    }
  }

  static async replaceTagsForSource (
    sourceId /*: string */,
    tags /*: Array<string> */
  ) /*: Promise<any> */ {
    await this.deleteSourceTagsOfSource(sourceId)
    return await this.addMultipleTagsToSource(sourceId, tags)
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
