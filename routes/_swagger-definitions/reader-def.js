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
 *       username:
 *         type: string
 *       profilePicture:
 *         type: string
 *       role:
 *         type: string
 *         enum: ['reader', 'admin']
 *         default: 'reader'
 *       status:
 *         type: string
 *         enum: ['active', 'inactive', 'deleted']
 *         default: 'active'
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
