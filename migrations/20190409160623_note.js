exports.up = function (knex, Promise) {
  return knex.schema.createTable('Note', function (table) {
    table.uuid('id').primary()
    table.string('noteType').notNullable().index()
    table.text('content')
    table.jsonb('selector')
    table.jsonb('json')
    table
      .string('readerId')
      .references('id')
      .inTable('Reader')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table
      .uuid('documentId')
      .references('id')
      .inTable('Document')
      .index()
    table
      .uuid('publicationId')
      .references('id')
      .inTable('Publication')
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
