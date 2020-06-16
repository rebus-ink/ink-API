// @flow
const { BaseModel } = require('./BaseModel')
const { urlToId } = require('../utils/utils')
const debug = require('debug')('ink:models:Notebook_Source')

/*::
type NotebookSourceType = {
  id: string,
  notebookId: string,
  sourceId: string
};
*/

class Notebook_Source extends BaseModel {
  static get tableName () {
    return 'notebook_source'
  }

  static get idColumn () {
    return ['notebookId', 'sourceId']
  }

  static async addSourceToNotebook (
    notebookId /*: string */,
    sourceId /*: string */
  ) /*: Promise<any> */ {
    debug('**addSourceToNotebook**')
    debug('notebookId: ', notebookId, 'sourceId: ', sourceId)
    if (!notebookId) throw new Error('no notebook')
    if (!sourceId) throw new Error('no source')
    notebookId = urlToId(notebookId)
    sourceId = urlToId(sourceId)

    try {
      return await Notebook_Source.query().insertAndFetch({
        notebookId,
        sourceId
      })
    } catch (err) {
      debug('error: ', err.message)
      if (err.constraint === 'notebook_source_sourceid_foreign') {
        throw new Error('no source')
      } else if (err.constraint === 'notebook_source_notebookid_foreign') {
        throw new Error('no notebook')
      } else if (
        err.constraint === 'notebook_source_sourceid_notebookid_unique'
      ) {
        throw new Error(
          `Add Source to Notebook Error: Relationship already exists between Notebook ${notebookId} and Source ${sourceId}`
        )
      }
    }
  }

  static async removeSourceFromNotebook (
    notebookId /*: string */,
    sourceId /*: string */
  ) /*: Promise<NotebookSourceType|Error> */ {
    debug('**removeSourceFromNotebook**')
    debug('notebookId: ', notebookId, 'sourceId: ', sourceId)
    notebookId = urlToId(notebookId)
    sourceId = urlToId(sourceId)

    const result = await Notebook_Source.query()
      .delete()
      .where({
        notebookId,
        sourceId
      })
    debug('result: ', result)
    if (result === 0) {
      throw new Error(
        `Remove Source from Notebook Error: No Relation found between Notebook ${notebookId} and Source ${sourceId}`
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

module.exports = { Notebook_Source }
