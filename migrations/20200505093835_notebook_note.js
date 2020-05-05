
exports.up = function(knex, Promise) {
  return knex.schema.createTable('notebook_note', function(table){
    table.increments('id')
    table
      .string('noteId')
      .references('id')
      .inTable('Note')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.string('notebookId').references('id').inTable('Notebook').notNullable().onDelete('CASCADE').index()
    table.unique(['noteId', 'notebookId'])
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('notebook_note')
};
