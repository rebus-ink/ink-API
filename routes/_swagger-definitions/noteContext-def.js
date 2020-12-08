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
 *   required:
 *     - id
 *     - type
 *     - published
 *     - readerId
 *
 *   noteContext-input:
 *     allOf:
 *       - $ref: '#/definitions/noteContextGeneral'
 *     properties:
 *       type:
 *         type: string
 *
 *   noteContext:
 *     allOf:
 *       - $ref: '#/definitions/noteContext-input'
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
 *       published:
 *         type: string
 *         format: date-time
 *         readOnly: true
 *       updated:
 *         type: string
 *         format: date-time
 *         readOnly: true
 *
 *   outline-input:
 *     allOf:
 *       - $ref: '#/definitions/noteContextGeneral'
 *     type:
 *       type: string
 *       enum: ['outline']
 *
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
 *
 */
