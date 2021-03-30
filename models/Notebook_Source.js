// @flow
const { BaseModel } = require('./BaseModel')
const { urlToId } = require('../utils/utils')

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
    if (!notebookId) throw new Error('no notebook')
    if (!sourceId) throw new Error('no source')

    if (sourceId.indexOf(',') > -1) {
      const sources = sourceId.split(',')
      await this.addMultipleSourcesToNotebook(notebookId, sources)
    } else {
      notebookId = urlToId(notebookId)
      sourceId = urlToId(sourceId)
      try {
        return await Notebook_Source.query().insertAndFetch({
          notebookId,
          sourceId
        })
      } catch (err) {
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
  }

  static async addMultipleSourcesToNotebook (
    notebookId /*: string */,
    sources /*: Array<string> */
  ) /*: Promise<any> */ {
    const list = sources.map(source => {
      return { sourceId: urlToId(source), notebookId }
    })

    // ignores errors - if errors encountered with first insert, insert one by one
    try {
      await Notebook_Source.query().insert(list)
    } catch (err) {
      // if inserting all at once failed, insert one at a time and ignore errors
      list.forEach(async item => {
        try {
          await Notebook_Source.query().insert(item)
        } catch (err2) {
          // eslint-disable-next-line
          return
        }
      })
    }
  }

  static async replaceNotebooksForSource (
    sourceId /*: string */,
    notebooks /*: Array<string> */
  ) /*: Promise<any> */ {
    await this.deleteNotebooksOfSource(sourceId)
    return await this.addMultipleNotebooksToSource(sourceId, notebooks)
  }

  static async deleteNotebooksOfSource (
    sourceId /*: string */
  ) /*: Promise<number|Error> */ {
    if (!sourceId) return new Error('no source')

    return await Notebook_Source.query()
      .delete()
      .where({ sourceId: urlToId(sourceId) })
  }

  /**
   * warning: does not throw errors
   */
  static async addMultipleNotebooksToSource (
    sourceId /*: string */,
    notebooks /*: Array<string> */
  ) {
    const list = notebooks.map(notebook => {
      return { sourceId, notebookId: urlToId(notebook) }
    })

    // ignores errors - if errors encountered with first insert, insert one by one
    try {
      await Notebook_Source.query().insert(list)
    } catch (err) {
      // if inserting all at once failed, insert one at a time and ignore errors
      list.forEach(async item => {
        try {
          await Notebook_Source.query().insert(item)
        } catch (err2) {
          // eslint-disable-next-line
          return
        }
      })
    }
  }

  static async removeSourceFromNotebook (
    notebookId /*: string */,
    sourceId /*: string */
  ) /*: Promise<NotebookSourceType|Error> */ {
    notebookId = urlToId(notebookId)
    sourceId = urlToId(sourceId)

    const result = await Notebook_Source.query()
      .delete()
      .where({
        notebookId,
        sourceId
      })
    if (result === 0) {
      throw new Error(
        `Remove Source from Notebook Error: No Relation found between Notebook ${notebookId} and Source ${sourceId}`
      )
    } else {
      return result
    }
  }

  static async deleteSourceOfNotebooks (
    notebookId /*: string */
  ) /*: Promise<number|Error> */ {
    if (!notebookId) return new Error('no notebook')

    return await Notebook_Source.query()
      .delete()
      .where({ notebookId: urlToId(notebookId) })
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
