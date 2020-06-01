exports.up = function (knex, Promise) {
  return knex.schema.createTable('readActivity', function (table) {
    table.string('id').primary()
    table.json('selector')
    table.jsonb('json')
    table
      .string('readerId')
      .references('id')
      .inTable('Reader')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table
      .string('sourceId')
      .references('id')
      .inTable('Source')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table
      .timestamp('published')
      .defaultTo(knex.fn.now())
      .notNullable()
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('readActivity')
}
