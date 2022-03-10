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
 *   note-basic:
 *     properties:
 *       canonical:
 *         type: string
 *       stylesheet:
 *         type: object
 *       target:
 *         type: object
 *       document:
 *         type: string
 *       contextId:
 *         type: string
 *       body:
 *         type: array
 *         items:
 *           $ref: '#/definitions/noteBody'
 *       json:
 *         type: object
 *     required:
 *       - body
 *
 *   note-basic-return:
 *     allOf: '#/definitions/note-basic'
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       readerId:
 *         type: string
 *         format: url
 *         readOnly: true
 *       original:
 *         type: string
 *         format: url
 *         readOnly: true
 *       published:
 *         type: string
 *         format: date-time
 *         readOnly: true
 *       updated:
 *         type: string
 *         format: date-time
 *         readOnly: true
 *
 *   note-input:
 *     allOf: '#/definitions/note-basic'
 *     properties:
 *       sourceId:
 *         type: string
 *         format: url
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *       notebooks:
 *         type: array
 *         items:
 *           $ref: '#/definitions/notebook'
 *
 *
 *   note-for-noteContext:
 *     allOf: '#/definitions/note-basic'
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       shortId:
 *         type: string
 *         readOnly: true
 *       outlineData:
 *         type: object
 *         properties:
 *           previous:
 *             type: string
 *           next:
 *             type: string
 *           parentId:
 *             type: string
 *       relations:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             toNote:
 *               $ref: '#/definitions/note-basic-return'
 *             fromNote:
 *               $ref: '#/definitions/note-basic-return'
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *       sources:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: url
 *             name:
 *               type: string
 *       readerId:
 *         type: string
 *         format: url
 *         readOnly: true
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
 *       - shortId
 *
 *   note:
 *     allOf:
 *       - $ref: '#/definitions/note-basic-return'
 *     properties:
 *       reader:
 *         $ref: '#/definitions/reader'
 *         readOnly: true
 *       previous:
 *         type: string
 *         description: used for Outlines
 *       next:
 *         type: string
 *         description: used for Outlines
 *       parentId:
 *         type: string
 *         description: used for Outlines
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tags'
 *       relations:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             toNote:
 *               $ref: '#/definitions/note-basic-return'
 *             fromNote:
 *               $ref: '#/definitions/note-basic-return'
 *       notebook:
 *         $ref: '#/definitions/notebook-with-collaborator'
 *       source:
 *         type: object
 *         properties:
 *           id:
 *             type: string
 *             format: url
 *           name:
 *             type: string
 *           type:
 *             type: string
 *           metadata:
 *             type: object
 *           citation:
 *             type: string
 *           attributions:
 *             type: array
 *             items:
 *               $ref: '#/definitions/attribution'
 *         context:
 *           $ref: '#/definitions/noteContext'
 *
 *   noteWithPub:
 *     allOf:
 *       - $ref: '#/definitions/note-basic-return'
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
 *                   $ref: '#/definitions/attribution'
 *               editor:
 *                 type: array
 *                 items:
 *                   $ref: '#/definitions/attribution'
 *               type:
 *                 type: string
 *
 *
 *
 *   note-outline-input:
 *     allOf:
 *       - $ref: '#/definitions/note-input'
 *     properties:
 *       previous:
 *         type: string
 *         description: used for Outlines
 *       next:
 *         type: string
 *         description: used for Outlines
 *       parentId:
 *         type: string
 *         description: used for Outlines
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
