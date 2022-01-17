/**
 * @swagger
 * definition:
 *   notebook-input:
 *     properties:
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
 *     required:
 *       - name
 *       - status
 *
 *   notebook-return:
 *     allOf:
 *       - $ref: '#/definitions/notebook-input'
 *     properties:
 *       id:
 *         type: string
 *         format: url
 *         readOnly: true
 *       shortId:
 *         type: string
 *         readOnly: true
 *       readerId:
 *         type: string
 *         format: url
 *         readOnly: true
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
 *     - published
 *     - readerId
 *
 *   notebook-with-collaborator:
 *     allOf:
 *       - $ref: '#/defintions/notebook-return'
 *     properties:
 *       collaborators:
 *         type: array
 *         items:
 *           $ref: '#/definitions/collaborator'
 *         description: collaborators to this notebook
 *
 *   notebook-ref:
 *     allOf:
 *       - $ref: '#/definitions/notebook-return'
 *     properties:
 *       tags:
 *         type: array
 *         items:
 *           $ref: '#/definitions/tag'
 *         readOnly: true
 *         description: tags assigned to this notebook
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
 *       sources:
 *         type: array
 *         items:
 *           $ref: '#/definitions/sourceInNotebook'
 *         readOnly: true
 *         description: sources assigned to the notebook
 *       notes:
 *         type: array
 *         items:
 *           $ref: '#/definitions/noteWithPub'
 *         readOnly: true
 *         description: notes assigned to the notebook
 *       noteContexts:
 *         type: array
 *         items:
 *           $ref: '#/definitions/noteContext'
 *         readOnly: true
 *         description: noteContexts that belong to this notebook
 *       canvas:
 *         type: array
 *         items:
 *           $ref: '#/definitions/canvas'
 *         readOnly: true
 *         description: canvas that belong to this notebook
 *       collaborators:
 *         type: array
 *         items:
 *           $ref: '#/definitions/collaborator'
 *         description: collaborators to this notebook
 *
 *   notebook-list:
 *     properties:
 *       page:
 *         type: integer
 *       pageSize:
 *         type: integer
 *       totalItems:
 *         type: integer
 *       items:
 *         type: array
 *         items:
 *           $ref: '#/definitions/notebook-ref'
 *
 */
