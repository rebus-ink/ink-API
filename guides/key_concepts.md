# Key Concepts

## Object Types

### Readers
This is what we called the users. All other objects will belong to a Reader, as stored in the readerId property. 

### Sources
Sources are books, articles, images, etc. 
Sources can be associated with files (epubs, pdf, images, sound files) or linked to videos from Youtube or Vimeo.

#### Attributions
Attributions are part of Sources. They are authors, editors, etc. They are stored in a separate database table, but each Attribution only belongs to one Source. If a Reader has multiple Sources with the same author, the author will be stored separately for each Source. Sources can have multiple Attributions.

#### ReadActivities
ReadActivities are meant to record when a Source was last read and where the Reader stopped reading. A Source can have multiple ReadActivities. Each ReadActivity belongs to a single Source.

### Notes
Notes can have multiple Bodies. Each Body has content (optional) and a motivation (required). Motivations can be things like "commenting", "highlighting", "bookmarking", etc. 
An example of a Note with multiple bodies would be a highlight taken from a Source that has added comment by the Reader.

### Notebooks
Notebooks are meant to group Sources and Notes for a project, and they are the container for NoteContexts / Outlines. 
Notes, Sources and Tags can be associated with Notebooks in a many-to-many relationship.

### Tags
Tags that are currently used in the frontend include colours for Notes and flags for Notes and Sources. It would also be possible to create Tags of different types. They can be associated with Sources, Notes and Notebooks in a many-to-many relationship.

### NoteRelations
NoteRelations are not currently used in the frontend. They were meant to create links between Notes. 

### NoteContexts
NoteContexts are named "Pages" on the frontend. They are meant to be Outlines, Mindmaps and any other tools used to group and organize Notes. Notes are COPIED to the NoteContexts. Therefore any notes updated inside a NoteContext will not affect the original. Notes that are in NoteContexts are not returned in any Notes library outside of the NoteContext. 

### Outlines
Outlines are a type of NoteContexts. We created separate routes for Outlines because we added the functionality of organizing the Notes into a nested, ordered list before returning it to the frontend. Eventually, that functionality was also done in the frontend for performance reason and this created the mess we have with the current buggy outline tool. Sorry! :-(

### Collaborators
The concept of Collaborators was created in the backend but not used in the frontend yet. Collaborators are Readers that are added to a Notebook belonging to another Reader, giving them permission to view and edit content. 


## Other Concepts

### Library
Notice that we do not have a GET /sources endpoint to return all the sources. We instead use a GET /library, which returns not only sources, but also tags and the last source read. 

### Ids / ShortIds
Most of the main objects have ids that are urls.
For example: http://..../sources/<shortId>
Objects returned with contain both an "id" and a "shortId" property. In most cases, you will want to use the shortId. 

