// This query calculates the amount of ways and amount of meters in a given area

[out:csv(number,length)][maxsize:1000000000];
{{geocodeArea:Laakdal}}->.searchArea;
// gather results
(
  // query part for: “highway=*”
way(area.searchArea)["highway"~"^(primary|secondary|tertiary|unclassified|residential|living_street|service|pedestrian|track|path|cycleway|footway|bridleway|living_street|road)"][access!=private][bicycle!=use_sidepath][bicycle!=no][service!=driveway][service!=parking_aisle];
);
make stat number=count(ways),length=sum(length());
out;
