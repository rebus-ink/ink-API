exports.up = function(knex, Promise) {
  return knex.schema.createTable('note_tag', function(table){
    table.increments('id')
    table
      .string('noteId')
      .references('id')
      .inTable('Note')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.string('tagId').references('id').inTable('Tag').notNullable().onDelete('CASCADE').index()
    table.unique(['noteId', 'tagId'])
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('note_tag')
};