const { Note } = require('./Note')
const { Reader } = require('./Reader')
const { urlToId } = require('../utils/utils')
const urlparse = require('url').parse

class ReaderNotes {
  static async getNotesCount (readerId, filters) {
    // note: not applied with filters.document

    let resultQuery = Note.query(Note.knex())
      .count()
      .whereNull('Note.deleted')
      .andWhere('Note.readerId', '=', readerId)
      .leftJoin('NoteBody', 'NoteBody.noteId', '=', 'Note.id')

    if (filters.publication) {
      resultQuery = resultQuery.where(
        'Note.publicationId',
        '=',
        urlToId(filters.publication)
      )
    }
    if (filters.motivation) {
      resultQuery = resultQuery.where(
        'NoteBody.motivation',
        '=',
        filters.motivation
      )
    }

    if (filters.search) {
      resultQuery = resultQuery.where(
        'NoteBody.content',
        'ilike',
        '%' + filters.search.toLowerCase() + '%'
      )
    }

    if (filters.collection) {
      resultQuery = resultQuery
        .leftJoin('note_tag', 'note_tag.noteId', '=', 'Note.id')
        .leftJoin('Tag', 'note_tag.tagId', '=', 'Tag.id')
        .whereNull('Tag.deleted')
        .where('Tag.name', '=', filters.collection)
        .andWhere('Tag.type', '=', 'stack')
    }

    const result = await resultQuery

    return result[0].count
  }

  static async getNotes (
    readerAuthId /*: string */,
    limit /*: number */,
    offset /*: number */,
    filters /*: any */
  ) /*: Promise<Array<any>> */ {
    offset = !offset ? 0 : offset
    const { Document } = require('./Document')
    const qb = Reader.query(Reader.knex()).where('authId', '=', readerAuthId)
    let doc
    if (filters.document) {
      const path = urlparse(filters.document).path // '/publications/{pubid}/path/to/file'
      const startIndex = path.split('/', 3).join('/').length // index of / before path/to/file
      const docPath = path.substring(startIndex + 1) // 'path/to/file'
      const publicationId = path.substring(14, startIndex) // {pubid}
      doc = await Document.byPath(publicationId, docPath)
      // $FlowFixMe
      if (!doc) doc = { id: 'does not exist' } // to make sure it returns an empty array instead of failing

      // no pagination for filter by document
      offset = 0
      limit = 100000
    }

    const readers = await qb
      .eager('replies.[publication.[attributions], body]')
      .modifyEager('replies', builder => {
        builder.modifyEager('body', bodyBuilder => {
          bodyBuilder.select('content', 'language', 'motivation')
          bodyBuilder.whereNull('deleted')
        })
        builder.select('Note.*').from('Note')
        builder.distinct('Note.id')
        // load details of parent publication for each note
        builder.modifyEager('publication', pubBuilder => {
          pubBuilder.whereNull('Publication.deleted')
          pubBuilder.select(
            'id',
            'name',
            'type',
            'published',
            'updated',
            'deleted'
          )
        })
        builder.whereNull('Note.deleted')

        // filters
        if (filters.publication) {
          builder.where('publicationId', '=', urlToId(filters.publication))
        }
        if (filters.document) {
          builder.where('documentId', '=', urlToId(doc.id))
        }

        builder.leftJoin('NoteBody', 'NoteBody.noteId', '=', 'Note.id')
        if (filters.motivation) {
          builder.where('NoteBody.motivation', '=', filters.motivation)
        }

        if (filters.search) {
          builder.where(
            'NoteBody.content',
            'ilike',
            '%' + filters.search.toLowerCase() + '%'
          )
        }

        builder.leftJoin('note_tag', 'note_tag.noteId', '=', 'Note.id')
        builder.leftJoin('Tag', 'note_tag.tagId', '=', 'Tag.id')
        builder.whereNull('Tag.deleted')
        if (filters.collection) {
          builder
            .where('Tag.name', '=', filters.collection)
            .andWhere('Tag.type', '=', 'stack')
        }

        // orderBy
        if (filters.orderBy === 'created') {
          if (filters.reverse) {
            builder.orderBy('Note.published')
          } else {
            builder.orderBy('Note.published', 'desc')
          }
        }

        if (filters.orderBy === 'updated') {
          if (filters.reverse) {
            builder.orderBy('Note.updated')
          } else {
            builder.orderBy('Note.updated', 'desc')
          }
        }

        // paginate
        builder.limit(limit).offset(offset)
      })

    return readers[0]
  }
}

module.exports = { ReaderNotes }
