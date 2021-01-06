const { Note } = require('./Note')
const { Reader } = require('./Reader')
const { urlToId } = require('../utils/utils')
const _ = require('lodash')

class ReaderNotes {
  static applyFilters (query, filters) {
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

    if (filters.source) {
      query.where('Note.sourceId', '=', urlToId(filters.source))
    }
    if (filters.motivation) {
      query.where('NoteBody.motivation', '=', filters.motivation)
    }
    if (filters.notMotivation) {
      query.whereNot('NoteBody.motivation', '=', filters.notMotivation)
    }

    if (filters.search) {
      query.where(
        'NoteBody.formattedContent',
        'ilike',
        '%' + filters.search.toLowerCase() + '%'
      )
    }

    if (filters.publishedStart) {
      query.where('Note.published', '>=', filters.publishedStart)
    }

    if (filters.publishedEnd) {
      query.where('Note.published', '<=', filters.publishedEnd)
    }

    if (filters.updatedStart) {
      query.where('Note.updated', '>=', filters.updatedStart)
    }

    if (filters.updatedEnd) {
      query.where('Note.updated', '<=', filters.updatedEnd)
    }

    if (filters.notebook) {
      query
        .leftJoin('notebook_note', 'notebook_note.noteId', '=', 'Note.id')
        .leftJoin('Notebook', 'notebook_note.notebookId', '=', 'Notebook.id')
        .whereNull('Notebook.deleted')
        .where('Notebook.id', '=', filters.notebook)
    }

    if (stacks) {
      stacks.forEach(stack => {
        query
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
        query
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
        query
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
      query
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
  }

  static async getNotesCount (readerId, filters) {
    // note: not applied with filters.document

    let resultQuery = Note.query(Note.knex())
      .count()
      .whereNull('Note.deleted')
      .whereNull('Note.contextId')
      .andWhere('Note.readerId', '=', readerId)
      .leftJoin('NoteBody', 'NoteBody.noteId', '=', 'Note.id')

    this.applyFilters(resultQuery, filters)

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
    const qb = Reader.query(Reader.knex()).where('authId', '=', readerAuthId)

    if (filters.document) {
      // no pagination for filter by document
      offset = 0
      limit = 100000
    }

    const readers = await qb
      .withGraphFetched(
        'replies.[source.[attributions(selectAttributions)], body, tags(selectTags), notebooks(selectNotebooks)]'
      )
      .modifiers({
        selectTags (modifierBuilder) {
          modifierBuilder.select(
            'Tag.id',
            'Tag.type',
            'Tag.name',
            'Tag.published',
            'Tag.updated'
          )
        },
        selectAttributions (modifierBuilder) {
          modifierBuilder.select(
            'Attribution.id',
            'Attribution.name',
            'Attribution.role',
            'Attribution.isContributor',
            'Attribution.type',
            'Attribution.published'
          )
        },
        selectNotebooks (modifierBuilder) {
          modifierBuilder.select(
            'Notebook.id',
            'Notebook.name',
            'Notebook.status',
            'Notebook.published',
            'Notebook.updated'
          )
        }
      })
      .modifyGraph('replies', builder => {
        builder.modifyGraph('body', bodyBuilder => {
          bodyBuilder.select('content', 'language', 'motivation')
          bodyBuilder.whereNull('deleted')
        })
        builder
          .select(
            'Note.id',
            'Note.target',
            'Note.published',
            'Note.updated',
            'Note.sourceId'
          )
          .from('Note')
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
        builder.leftJoin('NoteBody', 'NoteBody.noteId', '=', 'Note.id')

        this.applyFilters(builder, filters)

        // filters
        if (filters.document) {
          builder.where('document', '=', filters.document)
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
