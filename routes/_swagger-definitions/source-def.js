// DEFINITIONS for
// attribution
// link
// source

/**
 * @swagger
 * definition:
 *   attribution:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *       type:
 *         type: string
 *         enum: ['Person', 'Organization']
 *       json:
 *         type: object
 *       isContributor:
 *         type: boolean
 *     required:
 *       - name
 *     description: attribution fields will also accept a single string for name. Also possible to have a single attribution instead of an array.
 *
 *   link:
 *     properties:
 *       url:
 *         type: string
 *         format: url
 *       encodingFormat:
 *         type: string
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       rel:
 *         type: string
 *       integrity:
 *         type: string
 *       length:
 *         type: number
 *       type:
 *         type: string
 *     required:
 *       - url
 *
 *   source-basic:
 *       type:
 *         type: string
 *         enum: [
  'Article',
  'Blog',
  'Book',
  'Chapter',
  'Collection',
  'Comment',
  'Conversation',
  'Course',
  'Dataset',
  'Drawing',
  'Episode',
  'Manuscript',
  'Map',
  'MediaObject',
  'MusicRecordig',
  'Painting',
  'Photograph',
  'Play',
  'Poster',
  'PublicationIssue',
  'PublicationVolume',
  'Review',
  'ShortStory',
  'Thesis',
  'VisualArtwork',
  'WebContent'
]
 *       author:
 *         type: array
 *         items:
 *           $ref: '#/definitions/attribution'
 *       editor:
 *         type: array
 *         items:
 *           $ref: '#/definitions/attribution'
 *       creator:
 *         type: array
 *         items:
 *           $ref: '#/definitions/attribution'
 *       contributor:
 *         type: array
 *         items:
 *           $ref: '#/definitions/attribution'
 *       illustrator:
 *         type: array
 *         items:
 *           $ref: '#/definitions/attribution'
 *       publisher:
 *         type: array
 *         items:
 *           $ref: '#/definitions/attribution'
 *       translator:
 *         type: array
 *         items:
 *           $ref: '#/definitions/attribution'
 *       copyrightHolder:
 *         type: array
 *         items:
 *           $ref: '#/definitions/attribution'
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *         description: tags assigned to this source
 *       abstract:
 *         type: string
 *       datePublished:
 *         type: string
 *         format: timestamp
 *       numberOfPages:
 *         type: number
 *       wordCount:
 *         type: number
 *       bookFormat:
 *         type: string
 *         enum: ['AudiobookFormat', 'EBook', 'GraphicNovel', 'Hardcover', 'Paperback']
 *       encodingFormat:
 *         type: string
 *       url:
 *         type: string
 *         format: url
 *       dateModified:
 *         type: string
 *         format: timestamp
 *       bookEdition:
 *         type: string
 *       isbn:
 *         type: string
 *       copyrightYear:
 *         type: number
 *       genre:
 *         type: string
 *       license:
 *         type: string
 *       description:
 *         type: string
 *       inDirection:
 *         type: string
 *         enum: ['ltr', 'rtl']
 *       inLanguage:
 *         type: array
 *         items:
 *           type: string
 *         description:
 *           Languages should be two-letter language codes. Will also accept a single string value instead of an array.
 *       keywords:
 *          type: array
 *          items:
 *            type: string
 *          description:
 *             Will also accept a single string value.
 *       status:
 *         type: string
 *         enum: ['test', 'archived', 'active']
 *         default: 'active'
 *       readingOrder:
 *         type: array
 *         items:
 *           $ref: '#/definitions/link'
 *       resources:
 *         type: array
 *         items:
 *           $ref: '#/definitions/link'
 *       links:
 *         type: array
 *         items:
 *           $ref: '#/definitions/link'
 *       json:
 *         type: object
 *       citation:
 *         type: object
 *       required:
 *         - name
 *         - type
 *
 *   sourceInNotebook:
 *     allOf:
 *       - $ref: '#/definitions/source-input'
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       readerId:
 *         type: string
 *         format: url
 *         readOnly: true
 *       published:
 *         type: string
 *         format: timestamp
 *         readOnly: true
 *       updated:
 *         type: string
 *         format: timestamp
 *         readOnly: true
 *     required:
 *       - id
 *       - name
 *       - readerId
 *       - published
 *
 *   source-input:
 *     allOf:
 *       - $ref: '#/definitions/source-basic'
 *     properties:
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *         description: tags assigned to this source
 *
 *   source-return:
 *     allOf:
 *       - $ref: '#/definitions/source-basic'
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       shortId:
 *         type: string
 *         readOnly: true
 *       readerId:
 *         type: string
 *         format: url
 *         readOnly: true
 *       published:
 *         type: string
 *         format: timestamp
 *         readOnly: true
 *       updated:
 *         type: string
 *         format: timestamp
 *         readOnly: true
 *
 *   source:
 *     allOf:
 *       - $ref: '#/definitions/source-input'
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       replies:
 *         type: array
 *         items:
 *           $ref: '#/definitions/note-basic-return'
 *         readOnly: true
 *       lastReadActivity:
 *         type: object
 *         readOnly: true
 *         properties:
 *           id:
 *             type: string
 *           selector:
 *             type: object
 *           json:
 *             type: object
 *       readerId:
 *         type: string
 *         format: url
 *         readOnly: true
 *       reader:
 *         $ref: '#/definitions/reader'
 *         readOnly: true
 *       published:
 *         type: string
 *         format: timestamp
 *         readOnly: true
 *       updated:
 *         type: string
 *         format: timestamp
 *         readOnly: true
 *     required:
 *       - id
 *       - name
 *       - readerId
 *       - type
 *       - published
 *
 *   source-ref:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       type:
 *         type: string
 *         enum: [
  'Article',
  'Blog',
  'Book',
  'Chapter',
  'Collection',
  'Comment',
  'Conversation',
  'Course',
  'Dataset',
  'Drawing',
  'Episode',
  'Manuscript',
  'Map',
  'MediaObject',
  'MusicRecordig',
  'Painting',
  'Photograph',
  'Play',
  'Poster',
  'PublicationIssue',
  'PublicationVolume',
  'Review',
  'ShortStory',
  'Thesis',
  'VisualArtwork',
  'WebContent'
]
 *       author:
 *         type: array
 *         items:
 *           $ref: '#/definitions/attribution'
 *       editor:
 *         type: array
 *         items:
 *           $ref: '#/definitions/attribution'
 *       datePublished:
 *         type: string
 *         format: timestamp
 *       bookFormat:
 *         type: string
 *         enum: ['AudiobookFormat', 'EBook', 'GraphicNovel', 'Hardcover', 'Paperback']
 *       encodingFormat:
 *         type: string
 *       inLanguage:
 *         type: array
 *         items:
 *           type: string
 *         description:
 *           Languages should be two-letter language codes. Will also accept a single string value instead of an array.
 *       status:
 *         type: string
 *         enum: ['test']
 *       citation:
 *         type: object
 *       resources:
 *         type: array
 *         items:
 *           $ref: '#/definitions/link'
 *       links:
 *         type: array
 *         items:
 *           $ref: '#/definitions/link'
 *       lastReadActivity:
 *         type: object
 *         readOnly: true
 *         properties:
 *           id:
 *             type: string
 *           selector:
 *             type: object
 *           json:
 *             type: object
 *       published:
 *         type: string
 *         format: timestamp
 *         readOnly: true
 *       updated:
 *         type: string
 *         format: timestamp
 *         readOnly: true
 *     required:
 *       - id
 *       - name
 *       - type
 *       - published
 *
 *   library:
 *     properties:
 *       page:
 *         type: integer
 *       pageSize:
 *         type: integer
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *       totalItems:
 *         type: integer
 *       items:
 *         type: array
 *         items:
 *           $ref: '#/definitions/source-ref'
 *       lastRead:
 *         type: array
 *         items:
 *           $ref: '#/definitions/source'
 *
 */
