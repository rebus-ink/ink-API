exports.up = function (knex, Promise) {
  return knex.schema.createTable('Note', function (table) {
    table.string('id').primary()
    table
      .string('readerId')
      .references('id')
      .inTable('Reader')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.string('canonical')
    table.jsonb('stylesheet')
    table.jsonb('target')
    table.jsonb('metadata')
    table.jsonb('json')
    table.string('documentUrl')
    table
      .string('documentId')
      .references('id')
      .inTable('Document')
      .index()
    table
      .string('publicationId')
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
