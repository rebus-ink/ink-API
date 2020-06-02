
exports.up = function(knex, Promise) {
  return knex.schema.createTable('notebook_source', function(table){
    table.increments('id')
    table
      .string('sourceId')
      .references('id')
      .inTable('Source')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.string('notebookId').references('id').inTable('Notebook').notNullable().onDelete('CASCADE').index()
    table.unique(['sourceId', 'notebookId'])
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('notebook_source')
};
