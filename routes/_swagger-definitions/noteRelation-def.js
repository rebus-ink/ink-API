/**
 * @swagger
 * definition:
 *   noteRelation-input:
 *     properties:
 *       type:
 *         type: string
 *       from:
 *         type: string
 *         format: url
 *       to:
 *         type: string
 *         format: url
 *       contextId:
 *         type: string
 *       json:
 *         type: object
 *     required:
 *       - from
 *       - to
 *       - type
 *
 *   noteRelation:
 *     allOf:
 *       - $ref: '#/definitions/noteRelation-input'
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
 *         format: date-time
 *         readOnly: true
 *       updated:
 *         type: string
 *         format: date-time
 *         readOnly: true
 *   required:
 *     - id
 *     - published
 *     - readerId
 *
 */
