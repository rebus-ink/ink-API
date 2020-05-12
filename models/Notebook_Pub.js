// @flow
const { BaseModel } = require('./BaseModel')
const { urlToId } = require('../utils/utils')

/*::
type NotebookPubType = {
  id: string,
  notebookId: string,
  publicationId: string
};
*/

class Notebook_Pub extends BaseModel {
  static get tableName () {
    return 'notebook_pub'
  }

  static get idColumn () {
    return ['notebookId', 'publicationId']
  }

  static async addPubToNotebook (
    notebookId /*: string */,
    publicationId /*: string */
  ) /*: Promise<any> */ {
    if (!notebookId) throw new Error('no notebook')
    if (!publicationId) throw new Error('no publication')
    notebookId = urlToId(notebookId)
    publicationId = urlToId(publicationId)

    try {
      return await Notebook_Pub.query().insertAndFetch({
        notebookId,
        publicationId
      })
    } catch (err) {
      if (err.constraint === 'notebook_pub_publicationid_foreign') {
        throw new Error('no publication')
      } else if (err.constraint === 'notebook_pub_notebookid_foreign') {
        throw new Error('no notebook')
      } else if (
        err.constraint === 'notebook_pub_publicationid_notebookid_unique'
      ) {
        throw new Error(
          `Add Publication to Notebook Error: Relationship already exists between Notebook ${notebookId} and Publication ${publicationId}`
        )
      }
    }
  }

  static async removePubFromNotebook (
    notebookId /*: string */,
    publicationId /*: string */
  ) /*: Promise<NotebookPubType|Error> */ {
    notebookId = urlToId(notebookId)
    publicationId = urlToId(publicationId)

    const result = await Notebook_Pub.query()
      .delete()
      .where({
        notebookId,
        publicationId
      })

    if (result === 0) {
      throw new Error(
        `Remove Publication from Notebook Error: No Relation found between Notebook ${notebookId} and Publication ${publicationId}`
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

module.exports = { Notebook_Pub }
