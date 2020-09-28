
exports.up = function(knex) {
  return knex.schema.table('NoteBody', (table) => {
    table.text('formattedContent')
  })
}

exports.down = function(knex) {
  return knex.schema.table('NoteBody', table => {
    table.dropColumn('formattedContent')
  })
}
