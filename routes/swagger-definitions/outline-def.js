/**
 * @swagger
 * definition:
 *   outline:
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
 *       settings:
 *         type: object
 *       status:
 *         type: string
 *         enum: ['active', 'archived']
 *         default: 'active'
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
 *     - name
 *     - published
 *     - readerId
 *     - status
 *
 *
 */
