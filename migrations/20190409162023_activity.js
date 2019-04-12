exports.up = function (knex, Promise) {
  return knex.schema.createTable('Activity', function (table) {
    table.uuid('id').primary()
    table.string('type').index().notNullable()
    table.jsonb('object')
    table.jsonb('target')
    table.jsonb('json')
    table
      .string('readerId')
      .references('id')
      .inTable('Reader')
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
  return knex.schema.dropTable('Activity')
}