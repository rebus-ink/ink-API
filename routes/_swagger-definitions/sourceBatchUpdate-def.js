/**
 * @swagger
 * definition:
 *   sourceBatchUpdateRequest:
 *     properties:
 *       sources:
 *         type: array
 *         items:
 *           type: string
 *           description: ids of sources to be updated
 *       operation:
 *         type: string
 *         enum: ['replace', 'add', 'remove']
 *       property:
 *         type: string
 *         enum: [  'type', 'bookFormat', 'status', 'encodingFormat', 'keywords', 'inLanguage',  'author', 'editor', 'contributor', 'creator', 'illustrator', 'publisher', 'translator', 'copyrightHolder']
 *       value:
 *         type: array
 *         items:
 *           type: string
 *
 *   sourceBatchUpdateResponseItem:
 *     status:
 *       type: integer
 *       enum: [204, 400, 404]
 *     id:
 *       type: string
 *       description: sourceId
 *     message:
 *       type: string
 *       description: error message, in case of 400 or 404 status
 *     value:
 *       type: string
 *       description: the value of the update
 *
 */
