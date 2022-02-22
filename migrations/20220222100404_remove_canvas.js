
exports.up = function (knex, Promise) {
  return knex.schema.dropTable('Canvas')
}

exports.down = function (knex, Promise) {

  return knex.schema.createTable('Canvas', function (table) {
    table.string('id').primary()
    table.string('name')
    table.string('description')
    table.jsonb('json')
    table.jsonb('settings')
    table
      .string('notebookId')
      .references('id')
      .inTable('Notebook')
      .onDelete('CASCADE')
      .index()
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
