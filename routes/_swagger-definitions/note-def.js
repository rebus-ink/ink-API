/**
 * @swagger
 * definition:
 *   noteBody:
 *     properties:
 *       content:
 *         type: string
 *       motivation:
 *         type: string
 *         enum: ['bookmarking', 'commenting', 'describing', 'editing', 'highlighting', 'replying']
 *       language:
 *         type: string
 *     required:
 *       - motivation
 *
 *   note-input:
 *     properties:
 *       canonical:
 *         type: string
 *       stylesheet:
 *         type: object
 *       target:
 *         type: object
 *       sourceId:
 *         type: string
 *         format: url
 *       document:
 *         type: string
 *       contextId:
 *         type: string
 *       body:
 *         type: array
 *         items:
 *           $ref: '#/definitions/noteBody'
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *       notebooks:
 *         type: array
 *         items:
 *           $ref: '#/definitions/notebook'
 *       json:
 *         type: object
 *     required:
 *       - body
 *
 *   note:
 *     allOf:
 *       - $ref: '#/definitions/note-input'
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       readerId:
 *         type: string
 *         format: url
 *         readOnly: true
 *       json:
 *         type: object
 *       published:
 *         type: string
 *         format: date-time
 *         readOnly: true
 *       updated:
 *         type: string
 *         format: date-time
 *         readOnly: true
 *     required:
 *       - id
 *       - readerId
 *       - published
 *
 *   noteWithPub:
 *     allOf:
 *       - $ref: '#/definitions/note'
 *       - type: object
 *         properties:
 *           source:
 *             properties:
 *               id:
 *                 type: string
 *                 format: url
 *               name:
 *                 type: string
 *               author:
 *                 type: array
 *                 items:
 *                   $ref: '#/definitions/annotation'
 *               editor:
 *                 type: array
 *                 items:
 *                   $ref: '#/definitions/annotation'
 *               type:
 *                 type: string
 *
 *   note-outline-input:
 *     allOf:
 *       - $ref: '#/definitions/note-input'
 *     properties:
 *       previous:
 *         type: string
 *       next:
 *         type: string
 *       parentId:
 *         type: string
 *
 *
 *   note-outline:
 *     allOf:
 *       - $ref: '#/definitions/note'
 *     properties:
 *       previous:
 *         type: string
 *       next:
 *         type: string
 *       parentId:
 *         type: string
 *
 *   notes:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *       totalItems:
 *         type: integer
 *       items:
 *         type: array
 *         items:
 *           $ref: '#/definitions/noteWithPub'
 *
 */
