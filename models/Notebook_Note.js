// @flow
const { BaseModel } = require('./BaseModel')
const { urlToId } = require('../utils/utils')

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

  static async removeNoteFromNotebook (
    notebookId /*: string */,
    noteId /*: string */
  ) /*: Promise<NotebookNoteType|Error> */ {
    notebookId = urlToId(notebookId)
    noteId = urlToId(noteId)

    const result = await Notebook_Note.query()
      .delete()
      .where({
        notebookId,
        noteId
      })

    if (result === 0) {
      throw new Error(
        `Remove Note from Notebook Error: No Relation found between Note ${noteId} and Notebook ${notebookId}`
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
