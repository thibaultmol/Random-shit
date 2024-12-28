/*
Query to find all objects (excluding relations) that were modified by someoene other than myself in the last x period in a given are (bbox).
Just for me (Flanders split into 10 even sections because Overpass can't handle all of Flanders in one go because it's too much data):
50.6800, 2.5400, 51.0950, 3.2160
50.6800, 3.2160, 51.0950, 3.8920
50.6800, 3.8920, 51.0950, 4.5680
50.6800, 4.5680, 51.0950, 5.2440
50.6800, 5.2440, 51.0950, 5.9200
51.0950, 2.5400, 51.5100, 3.2160
51.0950, 3.2160, 51.5100, 3.8920
51.0950, 3.8920, 51.5100, 4.5680
51.0950, 4.5680, 51.5100, 5.2440
51.0950, 5.2440, 51.5100, 5.9200
To easily run all these overpass queries, I made a simple html page that opens them all in JOSM: https://thibaultmol.github.io/Random-shit/pages/open_recent_changes.html
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
