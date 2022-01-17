/**
 * @swagger
 * definition:
 *   noteContextGeneral:
 *     properties:
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       json:
 *         type: object
 *
 *   noteContext-input:
 *     allOf:
 *       - $ref: '#/definitions/noteContextGeneral'
 *     properties:
 *       type:
 *         type: string
 *       canvasId:
 *         type: string
 *       notebookId:
 *         type: string
 *    required:
 *      - type
 *
 *   noteContext-return:
 *     allOf:
 *       - $ref: '#/definitions/noteContext-input'
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
 *         format: date-time
 *         readOnly: true
 *       updated:
 *         type: string
 *         format: date-time
 *         readOnly: true
 *
 *   noteContext:
 *     allOf:
 *       - $ref: '#/definitions/noteContext-return'
 *     properties:
 *       reader:
 *         $ref: '#/definitions/reader'
 *         readOnly: true
 *       notebook:
 *         $ref: '#/definitions/notebook-with-collaborators'
 *         readOnly: true
 *       notes:
 *         $ref: '#/definitions/note-for-noteContext'
 *
 *   outline-input:
 *     allOf:
 *       - $ref: '#/definitions/noteContextGeneral'
 *     type:
 *       type: string
 *       enum: ['outline']
 *
 *   outline:
 *     allOf:
 *       - $ref: '#/definitions/outline-input'
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       readerId:
 *         type: string
 *         format: url
 *         readOnly: true
 *       type:
 *         type: string
 *         enum: ['outline']
 *       published:
 *         type: string
 *         format: date-time
 *         readOnly: true
 *       updated:
 *         type: string
 *         format: date-time
 *         readOnly: true
 *       notes:
 *         type: array
 *         items:
 *           $ref: '#/definitions/note-outline'
 *
 */
