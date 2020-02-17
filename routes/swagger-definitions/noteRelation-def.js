/**
 * @swagger
 * definition:
 *   noteRelation:
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
 *       from:
 *         type: string
 *         format: url
 *       to:
 *         type: string
 *         format: url
 *       contextId:
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
 *     - from
 *     - to
 *     - type
 *     - published
 *     - readerId
 *
 */
