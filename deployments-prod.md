Deployment Nov 18, 2021

* fixed bug in pagination where it was counting the number of note bodies instead of the number of notes
* added filter by source type to advanced search
* filter sources and notes by notebook in advanced search
* advanced search

Deployment Sept 27, 2021

* outline docx including page numbers
* notes returned by the notes library now include json property
* moving a note to a notebook using the put/notes/:id endpoint will also move the corresponding source
* same but with post/notes
* moving a note to a notebook now moves the corresponding source too
* better editing to docx
* return source with whole notes
* added source list to docx
* docx (was released earlier. forgot to update here)
* fixed outline to return buffer
* outline docx route added

Deployment June 17, 2021

* Adding multiple notes to an outline (with or without shortId)
* Allow notes to be created or copied to an outline with a shortId assigned by the frontend. (#664)

Deployment April 23, 2021

* removed temporary fixes
  Deployment April 23, 2021
* temporary fixes to delete broken notebooks and add missing colour tags
* adding .notebooks to sources returned by the library (#660)

File created April 19, 2021
