const { Source } = require('./Source')
const { Attribution } = require('./Attribution')
const { Reader } = require('./Reader')

class Library {
  static async getLibraryCount (readerId, filter) {
    let author, attribution, type
    if (filter.author) author = Attribution.normalizeName(filter.author)
    if (filter.attribution) {
      attribution = Attribution.normalizeName(filter.attribution)
    }
    if (filter.type) {
      type =
        filter.type.charAt(0).toUpperCase() +
        filter.type.substring(1).toLowerCase()
    }

    let builder = Source.query(Source.knex())
      .select('Source.id')
      .from('Source')
    builder.distinct('Source.id')
    builder.whereNull('Source.deleted')
    builder.where('Source.readerId', '=', readerId)
    if (filter.title) {
      const title = filter.title.toLowerCase()
      builder.where('Source.name', 'ilike', `%${title}%`)
    }
    if (filter.language) {
      builder.whereJsonSupersetOf('Source.metadata:inLanguage', [
        filter.language
      ])
    }
    if (filter.keyword) {
      builder.whereJsonSupersetOf('Source.metadata:keywords', [
        filter.keyword.toLowerCase()
      ])
    }
    if (filter.type) {
      builder.where('Source.type', '=', type)
    }
    builder.leftJoin('Attribution', 'Attribution.sourceId', '=', 'Source.id')

    if (filter.author) {
      builder
        .where('Attribution.normalizedName', '=', author)
        .andWhere('Attribution.role', '=', 'author')
    }
    if (filter.attribution) {
      builder.where('Attribution.normalizedName', 'like', `%${attribution}%`)
      if (filter.role) {
        builder.andWhere('Attribution.role', '=', filter.role)
      }
    }
    builder.withGraphFetched('[tags, attributions]')
    if (filter.collection) {
      builder.leftJoin(
        'source_tag as source_tag_collection',
        'source_tag_collection.sourceId',
        '=',
        'Source.id'
      )
      builder.leftJoin(
        'Tag as Tag_collection',
        'source_tag_collection.tagId',
        '=',
        'Tag_collection.id'
      )
      builder.whereNull('Tag_collection.deleted')
      builder
        .where('Tag_collection.name', '=', filter.collection)
        .andWhere('Tag_collection.type', '=', 'stack')
    }
    if (filter.tag) {
      builder.leftJoin(
        'source_tag as source_tag_tag',
        'source_tag_tag.sourceId',
        '=',
        'Source.id'
      )
      builder.leftJoin(
        'Tag as Tag_tag',
        'source_tag_tag.tagId',
        '=',
        'Tag_tag.id'
      )
      builder.whereNull('Tag_tag.deleted')
      builder.where('Tag_tag.id', '=', filter.tag)
    }
    if (filter.search) {
      const search = filter.search.toLowerCase()
      builder.where(nestedBuilder => {
        nestedBuilder
          .where('Source.name', 'ilike', `%${search}%`)
          .orWhere('Attribution.normalizedName', 'ilike', `%${search}%`)
          .orWhere('Source.abstract', 'ilike', `%${search}%`)
          .orWhere('Source.description', 'ilike', `%${search}%`)
          .orWhereJsonSupersetOf('Source.metadata:keywords', [search])
      })
    }

    const result = await builder
    return result.length
  }

  static async getLibrary (
    readerAuthId /*: string */,
    limit /*: number */,
    offset /*: number */,
    filter /*: any */
  ) {
    offset = !offset ? 0 : offset
    let author, attribution, type
    if (filter.author) author = Attribution.normalizeName(filter.author)
    if (filter.attribution) {
      attribution = Attribution.normalizeName(filter.attribution)
    }
    if (filter.type) {
      type =
        filter.type.charAt(0).toUpperCase() +
        filter.type.substring(1).toLowerCase()
    }

    const readers = await Reader.query(Reader.knex())
      .where('Reader.authId', '=', readerAuthId)
      .skipUndefined()
      .withGraphFetched('[tags, sources]')
      .modifyGraph('sources', builder => {
        builder
          .select(
            'Source.id',
            'Source.metadata',
            'Source.name',
            'Source.datePublished',
            'Source.status',
            'Source.type',
            'Source.encodingFormat',
            'Source.published',
            'Source.updated',
            'Source.deleted',
            'Source.resources',
            'Source.links'
          )
          .from('Source')
        builder.distinct('Source.id')
        builder.whereNull('Source.deleted')
        if (filter.title) {
          const title = filter.title.toLowerCase()
          builder.where('Source.name', 'ilike', `%${title}%`)
        }
        if (filter.language) {
          builder.whereJsonSupersetOf('Source.metadata:inLanguage', [
            filter.language
          ])
        }
        if (filter.keyword) {
          builder.whereJsonSupersetOf('Source.metadata:keywords', [
            filter.keyword.toLowerCase()
          ])
        }
        if (filter.type) {
          builder.where('Source.type', '=', type)
        }
        builder.leftJoin(
          'Attribution',
          'Attribution.sourceId',
          '=',
          'Source.id'
        )

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
        builder.withGraphFetched('[tags, attributions]')
        if (filter.collection) {
          builder.leftJoin(
            'source_tag as source_tag_collection',
            'source_tag_collection.sourceId',
            '=',
            'Source.id'
          )
          builder.leftJoin(
            'Tag as Tag_collection',
            'source_tag_collection.tagId',
            '=',
            'Tag_collection.id'
          )
          builder.whereNull('Tag_collection.deleted')
          builder
            .where('Tag_collection.name', '=', filter.collection)
            .andWhere('Tag_collection.type', '=', 'stack')
        }
        if (filter.tag) {
          builder.leftJoin(
            'source_tag as source_tag_tag',
            'source_tag_tag.sourceId',
            '=',
            'Source.id'
          )
          builder.leftJoin(
            'Tag as Tag_tag',
            'source_tag_tag.tagId',
            '=',
            'Tag_tag.id'
          )
          builder.whereNull('Tag_tag.deleted')
          builder.where('Tag_tag.id', '=', filter.tag)
        }
        if (filter.search) {
          const search = filter.search.toLowerCase()
          builder.where(nestedBuilder => {
            nestedBuilder
              .where('Source.name', 'ilike', `%${search}%`)
              .orWhere('Attribution.normalizedName', 'ilike', `%${search}%`)
              .orWhere('Source.abstract', 'ilike', `%${search}%`)
              .orWhere('Source.description', 'ilike', `%${search}%`)
              .orWhereJsonSupersetOf('Source.metadata:keywords', [search])
          })
        }
        if (filter.orderBy === 'title') {
          if (filter.reverse) {
            builder.orderBy('Source.name', 'desc')
          } else {
            builder.orderBy('Source.name')
          }
        } else if (filter.orderBy === 'datePublished') {
          if (filter.reverse) {
            builder.orderByRaw('"datePublished" NULLS FIRST')
          } else {
            builder.orderByRaw('"datePublished" DESC NULLS LAST')
          }
        } else if (filter.orderBy === 'type') {
          if (filter.reverse) {
            builder.orderByRaw('"type" DESC NULLS FIRST')
          } else {
            builder.orderByRaw('"type" NULLS LAST')
          }
        } else {
          if (filter.reverse) {
            builder.orderBy('Source.updated')
          } else {
            builder.orderBy('Source.updated', 'desc')
          }
        }
        builder.limit(limit)
        builder.offset(offset)
      })
    return readers[0]
  }
}

module.exports = { Library }
