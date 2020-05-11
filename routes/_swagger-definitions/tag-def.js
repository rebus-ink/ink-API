/**
 * @swagger
 * definition:
 *   tag:
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
 *       type:
 *         type: string
 *       json:
 *         type: object
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
 */
