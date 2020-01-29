/**
 * @swagger
 * definition:
 *   job:
 *     properties:
 *       id:
 *         type: integer
 *       type:
 *         type: string
 *         enum: ['epub']
 *       published:
 *         type: string
 *         format: date-time
 *       finished:
 *         type: string
 *         format: date-time
 *       error:
 *         type: string
 *       publicationId:
 *         type: string
 *       status:
 *         type: integer
 *         enum: [302, 304, 500]
 *
 */
