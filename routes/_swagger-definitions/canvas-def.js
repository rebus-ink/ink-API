// DEFINITIONS for
// canvas

/**
 * @swagger
 * definition:
 *   canvas-input:
 *     properties:
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
 *     required:
 *       - notebookId
 *   canvas:
 *     allOf:
 *       - $ref: '#/definitions/canvas-input'
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       readerId:
 *         type: string
 *         format: url
 *         readOnly: true
 *       reader:
 *         $ref: '#/definitions/reader'
 *         readOnly: true
 *       notebook:
 *         $ref: '#/definitions/notebook'
 *         readOnly: true
 *       noteContexts:
 *         type: array
 *         items:
 *           $ref: '#/definitions/noteContext'
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
 *       - readerId
 *       - published
 *
 *   canvas-list:
 *     properties:
 *       totalItems:
 *         type: integer
 *       items:
 *         type: array
 *         items:
 *           $ref: '#/definitions/canvas'
 *
 *
 */
