module.exports = {
  info: {
    title: 'Reader API',
    version: '1.0.0',
    description: ''
  },
  components: {
    securitySchemes: {
      Bearer: {
        type: 'http',
        scheme: 'bearer'
      }
    }
  },
  openapi: '3.0.0',
  apis: ['server.js', './routes/*.js']
}
