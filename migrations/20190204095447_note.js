exports.up = function (knex, Promise) {
  return knex.schema.createTable('Note', function (table) {
    table.uuid('id').primary()
    table.string('type').defaultTo('text/html')
    table.jsonb('json')
    table
      .uuid('readerId')
      .references('id')
      .inTable('Reader')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table
      .uuid('documentId')
      .references('id')
      .inTable('Document')
      .notNullable()
      .index()
    table
      .uuid('publicationId')
      .references('id')
      .inTable('Publication')
      .notNullable()
      .index()
    table
      .timestamp('published')
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updated')
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('deleted')
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('Note')
}
