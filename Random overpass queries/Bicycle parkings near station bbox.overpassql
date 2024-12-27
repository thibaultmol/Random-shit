// This query finds all bicycle parkings within a specified distance of train stations that are within the viewbox.
[out:json][timeout:25];

// Define the distance in meters (e.g., 500 meters)
{{radius=500}}

// Find all train stations within the bounding box
node["railway"="station"]({{bbox}})->.stations;

// Find all bicycle parkings around the train stations within the specified radius
node(around.stations:{{radius}})["amenity"="bicycle_parking"];

// Print the results
out geom;
