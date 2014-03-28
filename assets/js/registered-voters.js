//written by RES and RWP as a fun way to get familiar with D3 and mapping!

var width = 960,
    height = 960;

var comma = d3.format(",");

var svg = d3.select("#viz").append("svg")
    .attr("width", width)
    .attr("height", height);

var projection = d3.geo.albers();

var path = d3.geo.path()
    .projection(projection);
    
//this is the line to update for a new color scale
var color = d3.scale.ordinal()
    .range(["#5555CC",  "#CC5555", "#cccccc"]);


var makeArc = function(r) {return (d3.svg.arc()
    .outerRadius(r - 10)
    .innerRadius(0))};

var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.value; });
    

var radiusScale = function(maxRadius) {
    var s = d3.scale.linear();
    s.domain([0, maxRadius]);
    s.range([10,70]);
    return s;
    }
    
d3.json("/assets/data/registered-voters-dc.json", function(error, json) {


  var wards = topojson.feature(json, json.objects["dc-wards"]);

  // Initialize a null projection, derive the optimal scale and translate
  // from the bounds, and update the projection.
  // Adapted from: http://stackoverflow.com/a/14691788
  projection
      .scale(1)
      .translate([0, 0]);

  var b = path.bounds(wards),
      s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
      t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

  projection
      .scale(s)
      .translate(t);

  // Draw the ward polygons.
  svg.selectAll(".ward")
      .data(wards.features)
    .enter().append("path")
      .attr("class", "ward")
      .attr("d", path);

  // Prepare data to populate the pie charts.
  color.domain(d3.keys(wards.features[0].properties.values));

 
  wards.features.forEach(function(d) {
    d.data = color.domain().map(function(field) {
      return { field: field, value: d.properties.values[field] };
    });
  });
  

  //create scale for pie chart size
  var maxRadius = 0;
  wards.features.forEach(function(d) {
    if (d.properties.c > maxRadius) {
        maxRadius = d.properties.c;
    }
    return maxRadius;});

  var rScale = radiusScale(maxRadius);
    

  //loop over wards - need to do this outside the svg in order to access
  //the radius size and adjust the pie chart radii separately.
  wards.features.forEach( function(feat) {
  
  var id = feat.id
  var radius = feat.properties.c
  var arc = makeArc(rScale(radius));

    //create empty pie charts
  var pies = svg.selectAll(".pie".concat(id))
      .data([feat])
    .enter().append("g")
      .attr("class", "pie".concat(id))
      .attr("width", radius * 2)
      .attr("height", radius * 2)
    .append("g")
      .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; });
      
    // Populate pie charts.
  pies.selectAll(".arc".concat(id))
      .data(function(d) {return pie(d.data);})
    .enter().append("path")
      .attr("class", "arc".concat(id))
      .attr("d", arc)
      .attr("id", "pie-chunk")
      .style("fill", function(d) { return color(d.data.field); });

      //create tooltips
  pies.selectAll(".arc".concat(id)).append("title")
      .text(function(d, i) { return "Ward " + id + " " + d.data.field + ": " + comma(d.data.value); });
});
  // Create the legend.
  var legend = svg.append("g")
      .attr("class", "legend")
      .attr("height", 60)
      .attr("width", 60)
    .selectAll("g")
      .data(color.domain())
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      //legend color boxes
  legend.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

    //legend text
  legend.append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .text(function(d, i) {
        var text = color.domain()[i];
        return text;
      });
});

