/*
Query to find all objects (excluding relations) that were modified by someoene other than myself in the last x period in a given area. See alternate version if using bbox instead of geocode.
*/
[out:json][timeout:3600]

// Define the West-Flanders region.
{{geocodeArea:West-Flanders}}->.searchArea;

// Retrieve all objects that were modified at any point by the user "thibaultmol".
(nw(user_touched:"Thibaultmol")(area.searchArea);)->.modifiedByThibaultmol;

// Retrieve all objects that were last modified by the user "thibaultmol".
(nw(user:"Thibaultmol")(area.searchArea);)->.lastTouchedByThibaultmol;

// Subtract the objects last touched by "thibaultmol" from those modified at any point by "thibaultmol".
(.modifiedByThibaultmol; - .lastTouchedByThibaultmol;)->.modifiedByOthers;

// Filter to show only objects modified by someone else in the last week.
nwr.modifiedByOthers(newer:"2024-12-20T00:00:00Z");

// Output the result.
out geom;
