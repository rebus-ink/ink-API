exports.up = function (knex, Promise) {
  return knex.schema.createTable('OutlineData', function (table) {
    table.string('id').primary()
    table
      .string('readerId')
      .references('id')
      .inTable('Reader')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table
      .string('noteId')
      .references('id')
      .inTable('Note')
      .onDelete('SET NULL')
      .index()
    table.string('previous')
      .references('id')
      .inTable('Note')
      .onDelete('SET NULL')
    table.string('next')
      .references('id')
      .inTable('Note')
      .onDelete('SET NULL')
    table.string('parentId')
      .references('id')
      .inTable('Note')
      .onDelete('SET NULL')
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
    table.unique('noteId')
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('OutlineData')
}
