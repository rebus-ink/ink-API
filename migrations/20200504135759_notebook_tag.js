
exports.up = function(knex, Promise) {
  return knex.schema.createTable('notebook_tag', function(table){
    table.increments('id')
    table
      .string('notebookId')
      .references('id')
      .inTable('Notebook')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.string('tagId').references('id').inTable('Tag').notNullable().onDelete('CASCADE').index()
    table.unique(['notebookId', 'tagId'])
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('notebook_tag')
};
