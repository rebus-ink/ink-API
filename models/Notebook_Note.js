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

    if (noteId.indexOf(',') > -1) {
      const notes = noteId.split(',')
      await this.addMultipleNotesToNotebook(notebookId, notes)
    } else {
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
        } else if (
          err.constraint === 'notebook_note_noteid_notebookid_unique'
        ) {
          throw new Error(
            `Add Note to Notebook Error: Relationship already exists between Notebook ${notebookId} and Note ${noteId}`
          )
        }
      }
    }
  }

  static async addMultipleNotesToNotebook (
    notebookId /*: string */,
    notes /*: Array<string> */
  ) /*: Promise<any> */ {
    const list = notes.map(note => {
      return { noteId: urlToId(note), notebookId }
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

  static async deleteNoteOfNotebooks (
    notebookId /*: string */
  ) /*: Promise<number|Error> */ {
    if (!notebookId) return new Error('no notebook')

    return await Notebook_Note.query()
      .delete()
      .where({ notebookId: urlToId(notebookId) })
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
