// @flow
const { BaseModel } = require('./BaseModel')
const { urlToId } = require('../utils/utils')
const debug = require('debug')('ink:models:Notebook_Note')

/*::
type NotebookNoteType = {
  id: string,
  notebookId: string,
  noteId: string
};
*/

class Notebook_Note extends BaseModel {
  static get tableName () {
    return 'notebook_note'
  }

  static get idColumn () {
    return ['notebookId', 'noteId']
  }

  static async addNoteToNotebook (
    notebookId /*: string */,
    noteId /*: string */
  ) /*: Promise<any> */ {
    debug('**addNoteToNotebook**')
    debug('notebookId: ', notebookId, 'noteId: ', noteId)
    if (!notebookId) throw new Error('no notebook')
    if (!noteId) throw new Error('no note')
    notebookId = urlToId(notebookId)
    noteId = urlToId(noteId)

    try {
      return await Notebook_Note.query().insertAndFetch({
        notebookId,
        noteId
      })
    } catch (err) {
      debug('error: ', err.message)
      if (err.constraint === 'notebook_note_noteid_foreign') {
        throw new Error('no note')
      } else if (err.constraint === 'notebook_note_notebookid_foreign') {
        throw new Error('no notebook')
      } else if (err.constraint === 'notebook_note_noteid_notebookid_unique') {
        throw new Error(
          `Add Note to Notebook Error: Relationship already exists between Notebook ${notebookId} and Note ${noteId}`
        )
      }
    }
  }

  static async replaceNotebooksForNote (
    noteId /*: string */,
    notebooks /*: Array<string> */
  ) /*: Promise<any> */ {
    await this.deleteNotebooksOfNote(noteId)
    return await this.addMultipleNotebooksToNote(noteId, notebooks)
  }

  static async deleteNotebooksOfNote (
    noteId /*: string */
  ) /*: Promise<number|Error> */ {
    if (!noteId) return new Error('no note')

    return await Notebook_Note.query()
      .delete()
      .where({ noteId: urlToId(noteId) })
  }

  /**
   * warning: does not throw errors
   */
  static async addMultipleNotebooksToNote (
    noteId /*: string */,
    notebooks /*: Array<string> */
  ) {
    const list = notebooks.map(notebook => {
      return { noteId, notebookId: urlToId(notebook) }
    })

    // ignores errors - if errors encountered with first insert, insert one by one
    try {
      await Notebook_Note.query().insert(list)
    } catch (err) {
      // if inserting all at once failed, insert one at a time and ignore errors
      list.forEach(async item => {
        try {
          await Notebook_Note.query().insert(item)
        } catch (err2) {
          // eslint-disable-next-line
          return
        }
      })
    }
  }

  static async removeNoteFromNotebook (
    notebookId /*: string */,
    noteId /*: string */
  ) /*: Promise<NotebookNoteType|Error> */ {
    debug('**removeNoteFromNotebook**')
    debug('notebookId: ', notebookId, 'noteId: ', noteId)
    notebookId = urlToId(notebookId)
    noteId = urlToId(noteId)

    const result = await Notebook_Note.query()
      .delete()
      .where({
        notebookId,
        noteId
      })
    debug('result: ', result)
    if (result === 0) {
      throw new Error(
        `Remove Note from Notebook Error: No Relation found between Notebook ${notebookId} and Note ${noteId}`
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

module.exports = { Notebook_Note }
