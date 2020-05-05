
exports.up = function(knex, Promise) {
  return knex.schema.createTable('notebook_pub', function(table){
    table.increments('id')
    table
      .string('publicationId')
      .references('id')
      .inTable('Publication')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.string('notebookId').references('id').inTable('Notebook').notNullable().onDelete('CASCADE').index()
    table.unique(['publicationId', 'notebookId'])
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('notebook_pub')
};
