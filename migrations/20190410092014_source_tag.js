
exports.up = function(knex, Promise) {
  return knex.schema.createTable('source_tag', function(table){
    table.increments('id')
    table
      .string('sourceId')
      .references('id')
      .inTable('Source')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.string('tagId').references('id').inTable('Tag').notNullable().onDelete('CASCADE').index()
    table.unique(['sourceId', 'tagId'])
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('source_tag')
};
