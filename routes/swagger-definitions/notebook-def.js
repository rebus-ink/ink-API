/**
 * @swagger
 * definition:
 *   notebook-ref:
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
 *       status:
 *         type: string
 *         enum: ['active', 'archived']
 *         default: 'active'
 *       settings:
 *         type: object
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *         readOnly: true
 *         description: tags assigned to this notebook
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
 *     - status
 *     - published
 *     - readerId
 *
 *   notebook:
 *     allOf:
 *       - $ref: '#/definitions/notebook-ref'
 *     properties:
 *       notebookTags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *         readOnly: true
 *         description: tags that belong to the notebook
 *       publications:
 *         type: array
 *         items:
 *           $ref: '#/definitions/publication'
 *         readOnly: true
 *         description: publications assigned to the notebook
 *       notes:
 *         type: array
 *         items:
 *           $ref: '#/definitions/note'
 *         readOnly: true
 *         description: notes assigned to the notebook
 *       noteContexts:
 *         type: array
 *         items:
 *           $ref: '#/definitions/noteContext'
 *         readOnly: true
 *         description: noteContexts that belong to this notebook
 *
 *
 */
