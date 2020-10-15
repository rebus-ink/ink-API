// DEFINITIONS for
// canvas

/**
 * @swagger
 * definition:
 *   canvas:
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       notebookId:
 *         type: string
 *       json:
 *         type: object
 *       settings:
 *         type: object
 *       readerId:
 *         type: string
 *         format: url
 *         readOnly: true
 *       reader:
 *         $ref: '#/definitions/reader'
 *         readOnly: true
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
 *       - notebookId
 *       - readerId
 *       - published
 *
 *
 */
