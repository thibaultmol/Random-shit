// This query finds all bicycle parkings within a 500-meter radius of any train station in Belgium.
[out:json][timeout:25];

// Define the distance in meters
{{radius=500}}

// Fetch the area for Belgium
{{geocodeArea:Belgium}}->.searchArea;

// Find all train stations in Belgium
node["railway"="station"](area.searchArea)->.stations;

// Find all bicycle parkings around these train stations within the specified radius
node(around.stations:{{radius}})["amenity"="bicycle_parking"];

// Print the results
out geom;
