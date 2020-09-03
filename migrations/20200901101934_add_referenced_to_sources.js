
exports.up = function(knex) {
  return knex.schema.table('Source', function(table) {
    table.timestamp('referenced')
  })
};

exports.down = function(knex) {
  return knex.schema.table('Source', function(table) {
    table.dropColumn('referenced')
  })
};
