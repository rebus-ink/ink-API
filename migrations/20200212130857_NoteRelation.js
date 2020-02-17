exports.up = function (knex, Promise) {
  return knex.schema.createTable('NoteRelation', function (table) {
    table.string('id').primary()
    table.string('from')
      .references('id')
      .inTable('Note')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.string('to')
      .references('id')
      .inTable('Note')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.string('type').notNullable().index()
    table.string('contextId')
      .references('id')
      .inTable('NoteContext')
      .onDelete('CASCADE')
      .index()
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
    table
      .timestamp('updated')
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('deleted')
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('NoteRelation')
}
