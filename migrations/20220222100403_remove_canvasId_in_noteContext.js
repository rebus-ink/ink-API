
exports.up = function(knex) {
  return knex.schema.table('NoteContext', function(table) {
    table.dropColumn('canvasId')
  })
};

exports.down = function(knex) {

  return knex.schema.table('NoteContext', function(table) {
    table.timestamp('canvasId')
  })


};