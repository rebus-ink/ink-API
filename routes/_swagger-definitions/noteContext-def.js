/**
 * @swagger
 * definition:
 *   noteContextGeneral:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       readerId:
 *         type: string
 *         format: url
 *         readOnly: true
 *       name:
 *         type: string
 *       description:
 *         type: string
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
 *   required:
 *     - id
 *     - type
 *     - published
 *     - readerId
 *
 *   noteContext:
 *     allOf:
 *       - $ref: '#/definitions/noteContextGeneral'
 *     properties:
 *       type:
 *         type: string
 *
 *   outline:
 *     allOf:
 *       - $ref: '#/definitions/noteContextGeneral'
 *     type:
 *       type: string
 *       enum: ['outline']
 *
 */
