exports.up = function (knex, Promise) {
  return knex.schema.createTable('Document', function (table) {
    table.uuid('id').primary().index()
    table.string('mediaType')
      .defaultTo('text/html')
      .index()
    table.string('url').notNullable()
    table.string('path').notNullable().index()
    table.jsonb('json')
    table
      .string('readerId')
      .references('id')
      .inTable('Reader')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table
      .string('publicationId')
      .references('id')
      .inTable('Publication')
      .nullable()
      .notNullable()
      .onDelete('CASCADE')
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
  return knex.schema.dropTable('Document')
}
