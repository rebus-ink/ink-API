const { Publication } = require('./Publication')
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

    let builder = Publication.query(Publication.knex())
      .select('Publication.id')
      .from('Publication')
    builder.distinct('Publication.id')
    builder.whereNull('Publication.deleted')
    builder.where('Publication.readerId', '=', readerId)
    if (filter.title) {
      const title = filter.title.toLowerCase()
      builder.where('Publication.name', 'ilike', `%${title}%`)
    }
    if (filter.language) {
      builder.whereJsonSupersetOf('Publication.metadata:inLanguage', [
        filter.language
      ])
    }
    if (filter.keyword) {
      builder.whereJsonSupersetOf('Publication.metadata:keywords', [
        filter.keyword.toLowerCase()
      ])
    }
    if (filter.type) {
      builder.where('Publication.type', '=', type)
    }
    builder.leftJoin(
      'Attribution',
      'Attribution.publicationId',
      '=',
      'Publication.id'
    )

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
        'publication_tag as publication_tag_collection',
        'publication_tag_collection.publicationId',
        '=',
        'Publication.id'
      )
      builder.leftJoin(
        'Tag as Tag_collection',
        'publication_tag_collection.tagId',
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
        'publication_tag as publication_tag_tag',
        'publication_tag_tag.publicationId',
        '=',
        'Publication.id'
      )
      builder.leftJoin(
        'Tag as Tag_tag',
        'publication_tag_tag.tagId',
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
          .where('Publication.name', 'ilike', `%${search}%`)
          .orWhere('Attribution.normalizedName', 'ilike', `%${search}%`)
          .orWhere('Publication.abstract', 'ilike', `%${search}%`)
          .orWhere('Publication.description', 'ilike', `%${search}%`)
          .orWhereJsonSupersetOf('Publication.metadata:keywords', [search])
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
      .withGraphFetched('[tags, publications]')
      .modifyGraph('publications', builder => {
        builder
          .select(
            'Publication.id',
            'Publication.metadata',
            'Publication.name',
            'Publication.datePublished',
            'Publication.status',
            'Publication.type',
            'Publication.encodingFormat',
            'Publication.published',
            'Publication.updated',
            'Publication.deleted',
            'Publication.resources',
            'Publication.links'
          )
          .from('Publication')
        builder.distinct('Publication.id')
        builder.whereNull('Publication.deleted')
        if (filter.title) {
          const title = filter.title.toLowerCase()
          builder.where('Publication.name', 'ilike', `%${title}%`)
        }
        if (filter.language) {
          builder.whereJsonSupersetOf('Publication.metadata:inLanguage', [
            filter.language
          ])
        }
        if (filter.keyword) {
          builder.whereJsonSupersetOf('Publication.metadata:keywords', [
            filter.keyword.toLowerCase()
          ])
        }
        if (filter.type) {
          builder.where('Publication.type', '=', type)
        }
        builder.leftJoin(
          'Attribution',
          'Attribution.publicationId',
          '=',
          'Publication.id'
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
            'publication_tag as publication_tag_collection',
            'publication_tag_collection.publicationId',
            '=',
            'Publication.id'
          )
          builder.leftJoin(
            'Tag as Tag_collection',
            'publication_tag_collection.tagId',
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
            'publication_tag as publication_tag_tag',
            'publication_tag_tag.publicationId',
            '=',
            'Publication.id'
          )
          builder.leftJoin(
            'Tag as Tag_tag',
            'publication_tag_tag.tagId',
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
              .where('Publication.name', 'ilike', `%${search}%`)
              .orWhere('Attribution.normalizedName', 'ilike', `%${search}%`)
              .orWhere('Publication.abstract', 'ilike', `%${search}%`)
              .orWhere('Publication.description', 'ilike', `%${search}%`)
              .orWhereJsonSupersetOf('Publication.metadata:keywords', [search])
          })
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
        } else if (filter.orderBy === 'type') {
          if (filter.reverse) {
            builder.orderByRaw('"type" DESC NULLS FIRST')
          } else {
            builder.orderByRaw('"type" NULLS LAST')
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
}

module.exports = { Library }
