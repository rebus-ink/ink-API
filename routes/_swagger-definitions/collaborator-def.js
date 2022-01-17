// DEFINITIONS for
// collaborator

/**
 * @swagger
 * definition:
 *   collaborator-input:
 *     properties:
 *       readerId:
 *         type: string
 *       status:
 *         type: string
 *       permission:
 *         type: object
 *     required:
 *       - readerId
 *       - status
 *       - permission
 *   collaborator:
 *     allOf:
 *       - $ref: '#/definitions/collaborator-input'
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       reader:
 *         $ref: '#/definitions/reader'
 *         readOnly: true
 *       notebookId:
 *         type: string
 *         format: url
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
 *       - published
 *
 *
 */
