/**
 * @swagger
 * definition:
 *   reader:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       name:
 *         type: string
 *       profile:
 *         type: object
 *       preferences:
 *         type: object
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
 *       - published
 */
