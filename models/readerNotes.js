const { Note } = require('./Note')
const { Reader } = require('./Reader')
const { urlToId } = require('../utils/utils')
const debug = require('debug')('ink:models:readerNotes')
const _ = require('lodash')

class ReaderNotes {
  static async getNotesCount (readerId, filters) {
    debug('**getNotesCount**')
    debug('readerId: ', readerId)
    debug('filters: ', filters)
    // note: not applied with filters.document
    let flag, colour, tags, stacks
    if (filters.flag) {
      if (_.isArray(filters.flag)) {
        flag = filters.flag.map(item => item.toLowerCase())
        flag = _.uniq(flag)
      } else {
        flag = [filters.flag.toLowerCase()]
      }
    }

    if (filters.tag) {
      if (_.isArray(filters.tag)) {
        tags = filters.tag
      } else {
        tags = [filters.tag]
      }
    }

    if (filters.stack) {
      if (_.isArray(filters.stack)) {
        stacks = filters.stack
      } else {
        stacks = [filters.stack]
      }
    }

    if (filters.colour) {
      colour = filters.colour.toLowerCase()
    }
    let resultQuery = Note.query(Note.knex())
      .count()
      .whereNull('Note.deleted')
      .whereNull('Note.contextId')
      .andWhere('Note.readerId', '=', readerId)
      .leftJoin('NoteBody', 'NoteBody.noteId', '=', 'Note.id')

    if (filters.source) {
      resultQuery = resultQuery.where(
        'Note.sourceId',
        '=',
        urlToId(filters.source)
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

    if (filters.publishedStart) {
      resultQuery = resultQuery.where(
        'Note.published',
        '>=',
        filters.publishedStart
      )
    }

    if (filters.publishedEnd) {
      resultQuery = resultQuery.where(
        'Note.published',
        '<=',
        filters.publishedEnd
      )
    }

    if (filters.notebook) {
      resultQuery = resultQuery
        .leftJoin('notebook_note', 'notebook_note.noteId', '=', 'Note.id')
        .leftJoin('Notebook', 'notebook_note.notebookId', '=', 'Notebook.id')
        .whereNull('Notebook.deleted')
        .where('Notebook.id', '=', filters.notebook)
    }

    if (stacks) {
      stacks.forEach(stack => {
        resultQuery = resultQuery
          .leftJoin(
            `note_tag AS note_tag_${stack}`,
            `note_tag_${stack}.noteId`,
            '=',
            'Note.id'
          )
          .leftJoin(
            `Tag AS Tag_${stack}`,
            `note_tag_${stack}.tagId`,
            '=',
            `Tag_${stack}.id`
          )
          .whereNull(`Tag_${stack}.deleted`)
          .where(`Tag_${stack}.name`, '=', stack)
          .andWhere(`Tag_${stack}.type`, '=', 'stack')
      })
    }

    if (tags) {
      tags.forEach(tagId => {
        resultQuery = resultQuery
          .leftJoin(
            `note_tag AS note_tag_tag_${tagId}`,
            `note_tag_tag_${tagId}.noteId`,
            '=',
            'Note.id'
          )
          .leftJoin(
            `Tag AS Tag_tag_${tagId}`,
            `note_tag_tag_${tagId}.tagId`,
            '=',
            `Tag_tag_${tagId}.id`
          )
          .whereNull(`Tag_tag_${tagId}.deleted`)
          .where(`Tag_tag_${tagId}.id`, '=', tagId)
      })
    }

    if (filters.flag) {
      flag.forEach(tagName => {
        resultQuery = resultQuery
          .leftJoin(
            `note_tag AS note_tag_flag${tagName}`,
            `note_tag_flag${tagName}.noteId`,
            '=',
            'Note.id'
          )
          .leftJoin(
            `Tag AS Tag_flag${tagName}`,
            `note_tag_flag${tagName}.tagId`,
            '=',
            `Tag_flag${tagName}.id`
          )
          .whereNull(`Tag_flag${tagName}.deleted`)
          .where(`Tag_flag${tagName}.name`, '=', tagName)
          .andWhere(`Tag_flag${tagName}.type`, '=', 'flag')
      })
    }

    if (filters.colour) {
      resultQuery = resultQuery
        .leftJoin(
          'note_tag AS note_tag_colour',
          'note_tag_colour.noteId',
          '=',
          'Note.id'
        )
        .leftJoin(
          'Tag AS Tag_colour',
          'note_tag_colour.tagId',
          '=',
          'Tag_colour.id'
        )
        .whereNull('Tag_colour.deleted')
        .where('Tag_colour.name', '=', colour)
        .andWhere('Tag_colour.type', '=', 'colour')
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
    debug('**getNotes**')
    debug('readerAuthId: ', readerAuthId, 'limit: ', limit, 'offset: ', offset)
    debug('filters: ', filters)
    offset = !offset ? 0 : offset
    const qb = Reader.query(Reader.knex()).where('authId', '=', readerAuthId)
    let flag, colour, tags, stacks

    if (filters.flag) {
      if (_.isArray(filters.flag)) {
        flag = filters.flag.map(item => item.toLowerCase())
        flag = _.uniq(flag)
      } else {
        flag = [filters.flag.toLowerCase()]
      }
    }

    if (filters.tag) {
      if (_.isArray(filters.tag)) {
        tags = filters.tag
      } else {
        tags = [filters.tag]
      }
    }

    if (filters.stack) {
      if (_.isArray(filters.stack)) {
        stacks = filters.stack
      } else {
        stacks = [filters.stack]
      }
    }

    if (filters.colour) {
      colour = filters.colour.toLowerCase()
    }
    if (filters.document) {
      // no pagination for filter by document
      offset = 0
      limit = 100000
    }

    const readers = await qb
      .withGraphFetched(
        'replies.[source.[attributions], body, tags, notebooks]'
      )
      .modifyGraph('replies', builder => {
        builder.modifyGraph('body', bodyBuilder => {
          bodyBuilder.select('content', 'language', 'motivation')
          bodyBuilder.whereNull('deleted')
        })
        builder.select('Note.*').from('Note')
        builder.distinct('Note.id')
        // load details of parent source for each note
        builder.modifyGraph('source', pubBuilder => {
          pubBuilder.whereNull('Source.deleted')
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
        builder.whereNull('Note.contextId')

        // filters
        if (filters.source) {
          builder.where('sourceId', '=', urlToId(filters.source))
        }
        if (filters.document) {
          builder.where('document', '=', filters.document)
        }

        if (filters.publishedStart) {
          builder.where('Note.published', '>=', filters.publishedStart)
        }
        if (filters.publishedEnd) {
          builder.where('Note.published', '<=', filters.publishedEnd)
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

        if (filters.notebook) {
          builder.leftJoin(
            'notebook_note',
            'notebook_note.noteId',
            '=',
            'Note.id'
          )
          builder.leftJoin(
            'Notebook',
            'notebook_note.notebookId',
            '=',
            'Notebook.id'
          )
          builder.whereNull('Notebook.deleted')
          builder.where('Notebook.id', '=', filters.notebook)
        }

        if (stacks) {
          stacks.forEach(stack => {
            builder.leftJoin(
              `note_tag AS note_tag_${stack}`,
              `note_tag_${stack}.noteId`,
              '=',
              'Note.id'
            )
            builder.leftJoin(
              `Tag AS Tag_${stack}`,
              `note_tag_${stack}.tagId`,
              '=',
              `Tag_${stack}.id`
            )
            builder.whereNull(`Tag_${stack}.deleted`)

            builder
              .where(`Tag_${stack}.name`, '=', stack)
              .andWhere(`Tag_${stack}.type`, '=', 'stack')
          })
        }

        if (tags) {
          tags.forEach(tagId => {
            builder.leftJoin(
              `note_tag AS note_tag_${tagId}`,
              `note_tag_${tagId}.noteId`,
              '=',
              'Note.id'
            )
            builder.leftJoin(
              `Tag AS Tag_${tagId}`,
              `note_tag_${tagId}.tagId`,
              '=',
              `Tag_${tagId}.id`
            )
            builder.whereNull(`Tag_${tagId}.deleted`)
            builder.where(`Tag_${tagId}.id`, '=', tagId)
          })
        }

        if (filters.flag) {
          flag.forEach(tagName => {
            builder.leftJoin(
              `note_tag AS note_tag_flag${tagName}`,
              `note_tag_flag${tagName}.noteId`,
              '=',
              'Note.id'
            )
            builder.leftJoin(
              `Tag AS Tag_flag${tagName}`,
              `note_tag_flag${tagName}.tagId`,
              '=',
              `Tag_flag${tagName}.id`
            )
            builder.whereNull(`Tag_flag${tagName}.deleted`)
            builder
              .where(`Tag_flag${tagName}.name`, '=', tagName)
              .andWhere(`Tag_flag${tagName}.type`, '=', 'flag')
          })
        }

        if (filters.colour) {
          builder.leftJoin(
            'note_tag AS note_tag_colour',
            'note_tag_colour.noteId',
            '=',
            'Note.id'
          )
          builder.leftJoin(
            'Tag AS Tag_colour',
            'note_tag_colour.tagId',
            '=',
            'Tag_colour.id'
          )
          builder.whereNull('Tag_colour.deleted')
          builder
            .where('Tag_colour.name', '=', colour)
            .andWhere('Tag_colour.type', '=', 'colour')
        }

        // orderBy
        if (filters.orderBy === 'created') {
          if (filters.reverse) {
            builder.orderBy('Note.published')
          } else {
            builder.orderBy('Note.published', 'desc')
          }
        }

        if (filters.orderBy === 'updated' || !filters.orderBy) {
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
