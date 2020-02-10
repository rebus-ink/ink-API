// DEFINITIONS for
// annotation
// link
// publication

/**
 * @swagger
 * definition:
 *   annotation:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *       type:
 *         type: string
 *         enum: ['Person', 'Organization']
 *     required:
 *       - name
 *     description: annotation fields will also accept a single string for name. Also possible to have a single annotation instead of an array.
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
 *   publication:
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
 *           $ref: '#/definitions/annotation'
 *       editor:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       creator:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       contributor:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       illustrator:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       publisher:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       translator:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       copyrightHolder:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
 *       replies:
 *         type: array
 *         items:
 *           type: string
 *           format: url
 *         readOnly: true
 *         description: url Ids for Notes that belong to this publication
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *         readOnly: true
 *         description: tags assigned to this publication
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
 *         enum: ['test']
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
 *       position:
 *         type: object
 *         readOnly: true
 *       json:
 *         type: object
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
 *   publication-ref:
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
 *           $ref: '#/definitions/annotation'
 *       editor:
 *         type: array
 *         items:
 *           $ref: '#/definitions/annotation'
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
 *       resources:
 *         type: array
 *         items:
 *           $ref: '#/definitions/link'
 *       links:
 *         type: array
 *         items:
 *           $ref: '#/definitions/link'
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
 *       id:
 *         type: string
 *         format: url
 *       type:
 *         type: string
 *         enum: ['Collection']
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *       totalItems:
 *         type: integer
 *       items:
 *         type: array
 *         items:
 *           $ref: '#/definitions/publication-ref'
 *
 */
