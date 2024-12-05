// This query finds all bicycle parkings within a specified distance of "Station Gent-Sint-Pieters".
[out:json][timeout:25];

// Define the distance in meters (e.g., 500 meters)
{{radius=500}}

// Find all bicycle parkings around "Station Gent-Sint-Pieters" within the specified radius
node(around:{{radius}},{{geocodeCoords:Station Gent Sint Pieters}})["amenity"="bicycle_parking"];

// Print the results
out geom;
