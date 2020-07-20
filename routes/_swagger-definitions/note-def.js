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
 *   note:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       readerId:
 *         type: string
 *         format: url
 *         readOnly: true
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
 *       body:
 *         type: array
 *         items:
 *           $ref: '#/definitions/noteBody'
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *       published:
 *         type: string
 *         format: date-time
 *         readOnly: true
 *       updated:
 *         type: string
 *         format: date-time
 *         readOnly: true
 *       json:
 *         type: object
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
 *   noteWithContext:
 *     allOf:
 *       - $ref: '#/definitions/note'
 *       - type: object
 *         properties:
 *           contextId:
 *             type: string
 *           previous:
 *             type: string
 *           next:
 *             type: string
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
