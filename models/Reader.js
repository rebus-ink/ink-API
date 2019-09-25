const { BaseModel } = require('./BaseModel.js')
const { Model } = require('objection')
const _ = require('lodash')
const { Publication } = require('./Publication')
const { Note } = require('./Note')
const { ReadActivity } = require('./ReadActivity')
const { Job } = require('./Job')
const { Attribution } = require('./Attribution')
const { urlToId } = require('../utils/utils')
const urlparse = require('url').parse
const route = require('path-match')({
  sensitive: false,
  strict: false,
  end: false
})
const match = route('/publication-:context/:path*')

const attributes = ['id', 'authId', 'name', 'profile', 'json', 'preferences']

/*::
type ReaderType = {
  id: string,
  authId: string,
  name?: string,
  json?: Object,
  profile?: Object,
  preferences?: Object,
  published: Date,
  updated: Date
};
*/

/**
 * @property {User} user - Returns the user (with auth info) associated with this reader.
 * @property {Document[]} documents - Returns the documents owned buy this Reader.
 * @property {Publication[]} publications - Returns the publications owned buy this Reader.
 * @property {Note[]} replies - Returns the notes owned by this Reader.
 * @property {Activity[]} outbox - Returns the activities by this Reader.
 * @property {Attribution[]} attributions - Returns the creators/contributors in this Reader's library. How do we surface this in the Activity Streams JSON?
 * @property {Tag[]} tags - Returns the tags in this Reader's library.
 *
 * The core user object for Rebus Reader. Models references to all of the objects belonging to the reader. Each reader should only be able to see the publications, documents and notes they have uploaded.
 */
class Reader extends BaseModel {
  static async byAuthId (authId /*: string */) /*: Promise<Reader> */ {
    const readers = await Reader.query(Reader.knex()).where(
      'authId',
      '=',
      authId
    )
    return readers[0]
  }

  static async byId (
    id /*: string */,
    eager /*: string */
  ) /*: Promise<ReaderType> */ {
    const qb = Reader.query(Reader.knex()).where('id', '=', id)
    const readers = await qb.eager(eager)

    return readers[0]
  }

  static async getLibraryCount (readerId, filter) {
    let author, attribution
    if (filter.author) author = Attribution.normalizeName(filter.author)
    if (filter.attribution) {
      attribution = Attribution.normalizeName(filter.attribution)
    }

    let resultQuery = Publication.query(Publication.knex())
      .count()
      .whereNull('Publication.deleted')
      .andWhere('Publication.readerId', '=', readerId)

    if (filter.title) {
      resultQuery = resultQuery.where(
        'Publication.name',
        'ilike',
        `%${filter.title.toLowerCase()}%`
      )
    }
    if (filter.author) {
      resultQuery = resultQuery
        .leftJoin(
          'Attribution',
          'Attribution.publicationId',
          '=',
          'Publication.id'
        )
        .where('Attribution.normalizedName', '=', author)
        .andWhere('Attribution.role', '=', 'author')
    }
    if (filter.attribution) {
      resultQuery = resultQuery
        .leftJoin(
          'Attribution',
          'Attribution.publicationId',
          '=',
          'Publication.id'
        )
        .where('Attribution.normalizedName', 'like', `%${attribution}%`)
      if (filter.role) {
        resultQuery = resultQuery.andWhere('Attribution.role', '=', filter.role)
      }
    }
    if (filter.collection) {
      resultQuery = resultQuery
        .leftJoin(
          'publication_tag',
          'publication_tag.publicationId',
          '=',
          'Publication.id'
        )
        .leftJoin('Tag', 'publication_tag.tagId', '=', 'Tag.id')
        .where('Tag.name', '=', filter.collection)
        .andWhere('Tag.type', '=', 'reader:Stack')
    }

    const result = await resultQuery
    return result[0].count
  }

  static async getLibrary (
    readerId /*: string */,
    limit /*: number */,
    offset /*: number */,
    filter /*: any */
  ) {
    offset = !offset ? 0 : offset
    let author, attribution
    if (filter.author) author = Attribution.normalizeName(filter.author)
    if (filter.attribution) {
      attribution = Attribution.normalizeName(filter.attribution)
    }

    const readers = await Reader.query(Reader.knex())
      .where('Reader.id', '=', readerId)
      .skipUndefined()
      .eager('[tags, publications]')
      .modifyEager('publications', builder => {
        builder
          .select(
            'Publication.id',
            'Publication.description',
            'Publication.metadata',
            'Publication.name',
            'Publication.datePublished',
            'Publication.json',
            'Publication.readerId',
            'Publication.published',
            'Publication.updated',
            'Publication.deleted',
            'Publication.resources'
          )
          .from('Publication')
        builder.distinct('Publication.id')
        builder.whereNull('Publication.deleted')
        if (filter.title) {
          const title = filter.title.toLowerCase()
          builder.where('Publication.name', 'ilike', `%${title}%`)
        }
        builder.leftJoin(
          'Attribution',
          'Attribution.publicationId',
          '=',
          'Publication.id'
        )
        builder.leftJoin(
          'publication_tag',
          'publication_tag.publicationId',
          '=',
          'Publication.id'
        )
        builder.leftJoin('Tag', 'publication_tag.tagId', '=', 'Tag.id')
        builder.whereNull('Tag.deleted')
        if (filter.author) {
          builder
            .where('Attribution.normalizedName', '=', author)
            .andWhere('Attribution.role', '=', 'author')
        }
        if (filter.attribution) {
          builder.where(
            'Attribution.normalizedName',
            'like',
            `%${attribution}%`
          )
          if (filter.role) {
            builder.andWhere('Attribution.role', '=', filter.role)
          }
        }
        builder.eager('[tags, attributions]')
        if (filter.collection) {
          builder
            .where('Tag.name', '=', filter.collection)
            .andWhere('Tag.type', '=', 'reader:Stack')
        }
        if (filter.orderBy === 'title') {
          if (filter.reverse) {
            builder.orderBy('Publication.name', 'desc')
          } else {
            builder.orderBy('Publication.name')
          }
        } else if (filter.orderBy === 'datePublished') {
          if (filter.reverse) {
            builder.orderByRaw('"datePublished" NULLS FIRST')
          } else {
            builder.orderByRaw('"datePublished" DESC NULLS LAST')
          }
        } else {
          if (filter.reverse) {
            builder.orderBy('Publication.updated')
          } else {
            builder.orderBy('Publication.updated', 'desc')
          }
        }
        builder.limit(limit)
        builder.offset(offset)
      })
    return readers[0]
  }

  static async checkIfExistsByAuthId (
    authId /*: string */
  ) /*: Promise<boolean> */ {
    const readers = await Reader.query(Reader.knex()).where(
      'authId',
      '=',
      authId
    )
    return readers.length > 0
  }

  static async getNotesCount (readerId, filters) {
    // note: not applied with filters.document

    let resultQuery = Note.query(Note.knex())
      .count()
      .whereNull('Note.deleted')
      .andWhere('Note.readerId', '=', readerId)

    if (filters.publication) {
      resultQuery = resultQuery.where(
        'Note.publicationId',
        '=',
        urlToId(filters.publication)
      )
    }
    if (filters.type) {
      resultQuery = resultQuery.where('noteType', '=', filters.type)
    }
    if (filters.search) {
      resultQuery = resultQuery.whereRaw(
        'LOWER(content) LIKE ?',
        '%' + filters.search.toLowerCase() + '%'
      )
    }

    if (filters.collection) {
      resultQuery = resultQuery
        .leftJoin('note_tag', 'note_tag.noteId', '=', 'Note.id')
        .leftJoin('Tag', 'note_tag.tagId', '=', 'Tag.id')
        .whereNull('Tag.deleted')
        .where('Tag.name', '=', filters.collection)
        .andWhere('Tag.type', '=', 'reader:Stack')
    }

    const result = await resultQuery

    return result[0].count
  }

  static async getNotes (
    readerId /*: string */,
    limit /*: number */,
    offset /*: number */,
    filters /*: any */
  ) /*: Promise<Array<any>> */ {
    offset = !offset ? 0 : offset
    const { Document } = require('./Document')
    const qb = Reader.query(Reader.knex()).where('id', '=', readerId)
    let doc
    if (filters.document) {
      // $FlowFixMe
      const { context, path = [] } = match(urlparse(filters.document).path)
      // $FlowFixMe
      doc = await Document.byPath(context, path.join('/'))
      if (!doc) doc = { id: 'does not exist' } // to make sure it returns an empty array instead of failing

      // no pagination for filter by document
      offset = 0
      limit = 100000
    }

    const readers = await qb
      .eager('replies.[publication.[attributions]]')
      .modifyEager('replies', builder => {
        // load details of parent publication for each note
        builder.modifyEager('publication', pubBuilder => {
          pubBuilder.whereNull('Publication.deleted')
          pubBuilder.select(
            'id',
            'name',
            'description',
            'datePublished',
            'metadata'
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
        if (filters.type) {
          builder.where('noteType', '=', filters.type)
        }
        if (filters.search) {
          builder.whereRaw(
            'LOWER(content) LIKE ?',
            '%' + filters.search.toLowerCase() + '%'
          )
        }

        builder.leftJoin('note_tag', 'note_tag.noteId', '=', 'Note.id')
        builder.leftJoin('Tag', 'note_tag.tagId', '=', 'Tag.id')
        builder.whereNull('Tag.deleted')
        if (filters.collection) {
          builder
            .where('Tag.name', '=', filters.collection)
            .andWhere('Tag.type', '=', 'reader:Stack')
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

  static async createReader (
    authId /*: string */,
    person /*: any */
  ) /*: Promise<ReaderType> */ {
    const props = _.pick(person, attributes)

    props.authId = authId
    try {
      return await Reader.query(Reader.knex())
        .insert(props)
        .returning('*')
    } catch (err) {
      return err
    }
  }

  static get tableName () /*: string */ {
    return 'Reader'
  }
  get path () /*: string */ {
    return 'reader'
  }
  static get jsonSchema () /*: any */ {
    return {
      type: 'object',
      title: 'Reader Profile',
      properties: {
        id: { type: 'string' },
        authId: { type: 'string' },
        type: { const: 'Person' },
        profile: {
          type: 'object',
          additionalProperties: true
        },
        preferences: {
          type: 'object',
          additionalProperties: true
        },
        published: { type: 'string', format: 'date-time' },
        updated: { type: 'string', format: 'date-time' },
        json: {
          type: 'object',
          additionalProperties: true
        }
      },
      // required: ['authId'],
      additionalProperties: true
    }
  }
  static get relationMappings () /*: any */ {
    const { Document } = require('./Document')
    const { Activity } = require('./Activity.js')
    const { Tag } = require('./Tag.js')
    return {
      publications: {
        relation: Model.HasManyRelation,
        modelClass: Publication,
        join: {
          from: 'Reader.id',
          to: 'Publication.readerId'
        }
      },
      outbox: {
        relation: Model.HasManyRelation,
        modelClass: Activity,
        join: {
          from: 'Reader.id',
          to: 'Activity.readerId'
        }
      },
      readActivities: {
        relation: Model.HasManyRelation,
        modelClass: ReadActivity,
        join: {
          from: 'Reader.id',
          to: 'readActivity.readerId'
        }
      },
      jobs: {
        relation: Model.HasManyRelation,
        modelClass: Job,
        join: {
          from: 'Reader.id',
          to: 'job.readerId'
        }
      },
      replies: {
        relation: Model.HasManyRelation,
        modelClass: Note,
        join: {
          from: 'Reader.id',
          to: 'Note.readerId'
        }
      },
      documents: {
        relation: Model.HasManyRelation,
        modelClass: Document,
        join: {
          from: 'Reader.id',
          to: 'Document.readerId'
        }
      },
      attributions: {
        relation: Model.HasManyRelation,
        modelClass: Attribution,
        join: {
          from: 'Reader.id',
          to: 'Attribution.readerId'
        }
      },
      tags: {
        relation: Model.HasManyRelation,
        modelClass: Tag,
        join: {
          from: 'Reader.id',
          to: 'Tag.readerId'
        }
      }
    }
  }

  $formatJson (json /*: any */) /*: any */ {
    json = super.$formatJson(json)
    Object.assign(json, {
      id: this.id,
      name: this.name,
      type: 'Person',
      summaryMap: {
        en: `Reader with id ${this.id}`
      },
      inbox: `${this.id}/inbox`,
      outbox: `${this.id}/activity`,
      preferences: this.preferences,
      profile: this.profile,
      json: this.json,
      published: this.published,
      updated: this.updated
    })
    return json
  }

  asRef () /*: {name: string, id: string, type: string} */ {
    return {
      id: this.id,
      type: 'Person',
      name: this.name
    }
  }

  $beforeInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeInsert(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.updated = new Date().toISOString()
    })
  }
}

module.exports = { Reader }
