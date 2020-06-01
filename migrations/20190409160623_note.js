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
      .string('document')
      .index()
    table
      .string('sourceId')
      .references('id')
      .inTable('Source')
      .onDelete('SET NULL')
      .index()
    table
      .string('original')
      .references('id')
      .inTable('Note')
      .onDelete('SET NULL')
    table
      .string('contextId')
      .references('id')
      .inTable('NoteContext')
      .onDelete('CASCADE')
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
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('Note')
}
