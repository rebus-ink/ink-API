/**
 * @swagger
 * definition:
 *   noteContext:
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
 */
