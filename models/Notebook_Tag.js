// @flow
const { BaseModel } = require('./BaseModel')
const { urlToId } = require('../utils/utils')

/*::
type NotebookTagType = {
  id: string,
  notebookId: string,
  tagId: string
};
*/

class Notebook_Tag extends BaseModel {
  static get tableName () {
    return 'notebook_tag'
  }

  static get idColumn () {
    return ['notebookId', 'tagId']
  }

  static async addTagToNotebook (
    notebookId /*: string */,
    tagId /*: string */
  ) /*: Promise<any> */ {
    if (!notebookId) throw new Error('no notebook')
    if (!tagId) throw new Error('no tag')
    notebookId = urlToId(notebookId)

    try {
      return await Notebook_Tag.query().insertAndFetch({
        notebookId,
        tagId
      })
    } catch (err) {
      if (err.constraint === 'notebook_tag_tagid_foreign') {
        throw new Error('no tag')
      } else if (err.constraint === 'notebook_tag_notebookid_foreign') {
        throw new Error('no notebook')
      } else if (err.constraint === 'notebook_tag_notebookid_tagid_unique') {
        throw new Error(
          `Add Tag to Notebook Error: Relationship already exists between Notebook ${notebookId} and Tag ${tagId}`
        )
      }
    }
  }

  static async removeTagFromNotebook (
    notebookId /*: string */,
    tagId /*: string */
  ) /*: Promise<NotebookTagType|Error> */ {
    notebookId = urlToId(notebookId)

    const result = await Notebook_Tag.query()
      .delete()
      .where({
        notebookId,
        tagId
      })

    if (result === 0) {
      throw new Error(
        `Remove Tag from Notebook Error: No Relation found between Notebook ${notebookId} and Tag ${tagId}`
      )
    } else {
      return result
    }
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

module.exports = { Notebook_Tag }
