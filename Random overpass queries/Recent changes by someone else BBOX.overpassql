/*
Query to find all objects (excluding relations) that were modified by someoene other than myself in the last x period in a given are (bbox).
Just for me (Flanders split into 4 even sections horizontally because Overpass can't handle all of Flanders in one go because it's too much data):
50.68, 2.540, 51.51, 3.385
50.68, 3.385, 51.51, 4.230
50.68, 4.230, 51.51, 5.075
50.68, 5.075, 51.51, 5.920
*/
[out:json][timeout:3600]
[bbox:50.68, 2.540, 51.51, 3.385];

// Retrieve all objects that were modified at any point by the user "thibaultmol".
nwr(user_touched:"Thibaultmol")->.modifiedByThibaultmol;

// Retrieve all objects that were last modified by the user "thibaultmol".
nw(user:"Thibaultmol")->.lastTouchedByThibaultmol;

// Subtract the objects last touched by "thibaultmol" from those modified at any point by "thibaultmol".
(.modifiedByThibaultmol; - .lastTouchedByThibaultmol;)->.modifiedByOthers;

// Filter to show only objects modified by someone else in the last week.
nw.modifiedByOthers(newer:"2024-12-20T00:00:00Z");

// Output the result.
out geom;
