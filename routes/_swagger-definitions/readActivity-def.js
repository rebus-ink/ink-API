/**
 * @swagger
 * definition:
 *   readActivity-input:
 *     properties:
 *       'selector':
 *         type: object
 *       json:
 *         type: object
 *
 *   readActivity:
 *     allOf:
 *       - $ref: '#/definitions/readActivity-input'
 *     properties:
 *       id:
 *         type: string
 *       sourceId:
 *         type: string
 *       readerId:
 *         type: string
 *       published:
 *         type: string
 */
