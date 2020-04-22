/**
 * @swagger
 * definition:
 *   publicationBatchUpdateRequest:
 *     properties:
 *       publications:
 *         type: array
 *         items:
 *           type: string
 *           description: ids of publications to be updated
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
 *   publicationBatchUpdateResponseItem:
 *     status:
 *       type: integer
 *       enum: [204, 400, 404]
 *     id:
 *       type: string
 *       description: publicationId
 *     message:
 *       type: string
 *       description: error message, in case of 400 or 404 status
 *     value:
 *       type: string
 *       description: the value of the update
 *
 */
