//URL provided by freeCodeCamp

const url =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

//colorList from www.colorbrewer.org

const colorList = [
  "#d53e4f",
  "#f46d43",
  "#fdae61",
  "#fee08b",
  "#ffffbf",
  "#e6f598",
  "#abdda4",
  "#66c2a5",
  "#3288bd"
].reverse();

d3.json(url)
  .then((data) => callback(data))
  .catch((err) => console.log(err));

function callback(data) {
  data.monthlyVariance.forEach((d) => {
    d.month -= 1;
  });

  var title = d3
    .select("#chart")
    .append("h1")
    .attr("id", "title")
    .text("Monthly Average Land-Surface Temperature");

  const toMonthName = (monthNumber) =>
    new Date(0, monthNumber).toLocaleString("en-US", { month: "long" });

  var subtitle = d3
    .select("#chart")
    .append("h2")
    .attr("id", "description")
    .html(
      "From " +
        toMonthName(data.monthlyVariance[0].month) +
        ", " +
        data.monthlyVariance[0].year +
        " to " +
        toMonthName(
          data.monthlyVariance[data.monthlyVariance.length - 1].month
        ) +
        ", " +
        data.monthlyVariance[data.monthlyVariance.length - 1].year +
        ". Base Temperature: " +
        data.baseTemperature +
        "°C"
    );

  const padding = 120;
  const paddingTop = 20;
  const width = 5 * Math.ceil(data.monthlyVariance.length / 12);
  const height = 35 * 12;

  var tip = d3
    .tip()
    .html((d) => d)
    .attr("id", "tooltip");

  var svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width + 2 * padding)
    .attr("height", height + padding + paddingTop)
    .call(tip);

  var xScale = d3
    .scaleBand()
    .domain(data.monthlyVariance.map((d) => d.year))
    .range([0, width]);

  var xAxis = d3
    .axisBottom()
    .scale(xScale)
    .tickValues(xScale.domain().filter((year) => year % 10 === 0));

  svg
    .append("g")
    .attr("id", "x-axis")
    .attr(
      "transform",
      "translate(" + padding + "," + (paddingTop + height) + ")"
    )
    .call(xAxis)
    .append("text")
    .text("Years")
    .attr("transform", "translate(" + width / 2 + "," + padding / 3 + ")")
    .attr("fill", "black")
    .style("font-weight", "bold");

  var yScale = d3
    .scaleBand()
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    .range([0, height]);

  var yAxis = d3
    .axisLeft()
    .scale(yScale)
    .tickFormat((month) => d3.timeFormat("%B")(new Date(0, month)));

  svg
    .append("g")
    .attr("id", "y-axis")
    .attr("transform", "translate(" + padding + "," + paddingTop + ")")
    .call(yAxis)
    .append("text")
    .text("Months")
    .attr(
      "transform",
      "translate(" + -(padding / 2.5) + "," + height / 2 + ")" + " rotate(-90)"
    )
    .attr("fill", "black")
    .style("font-weight", "bold");

  //Legend adapted from https://codepen.io/freeCodeCamp/pen/JEXgeY?editors=0010 which originally followed the example of https://bl.ocks.org/mbostock/4573883

  var legendWidth = 400;
  var legendHeight = 35;

  var variance = data.monthlyVariance.map((d) => d.variance);
  var minTemp = data.baseTemperature + Math.min(...variance);
  var maxTemp = data.baseTemperature + Math.max(...variance);

  var legendThresholds = d3
    .scaleThreshold()
    .domain(
      ((min, max, totalSteps) => {
        var array = [];
        var step = (max - min) / totalSteps;
        for (var i = 1; i < totalSteps; i++) {
          array.push(min + i * step);
        }
        return array;
      })(minTemp, maxTemp, colorList.length)
    )
    .range(colorList);

  var legendX = d3
    .scaleLinear()
    .domain([minTemp, maxTemp])
    .range([0, legendWidth]);

  var legendXAxis = d3
    .axisBottom()
    .scale(legendX)
    .tickSize(10, 0)
    .tickValues([minTemp, ...legendThresholds.domain(), maxTemp])
    .tickFormat(d3.format(".1f"));

  var legend = svg
    .append("g")
    .attr("id", "legend")
    .attr(
      "transform",
      "translate(" + padding + "," + (height + (padding + paddingTop) / 2) + ")"
    );

  legend
    .append("g")
    .selectAll("rect")
    .data(
      legendThresholds.range().map((color) => {
        var d = legendThresholds.invertExtent(color);
        if (d[0] === null) {
          d[0] = legendX.domain()[0];
        }
        if (d[1] === null) {
          d[1] = legendX.domain()[1];
        }
        return d;
      })
    )
    .enter()
    .append("rect")
    .style("fill", (d) => legendThresholds(d[0]) ?? colorList[0])
    .attr("x", (d) => legendX(d[0]))
    .attr("y", 0)
    .attr("width", legendWidth / 9)
    .attr("height", legendHeight);

  legend
    .append("g")
    .attr("transform", "translate(" + 0 + "," + legendHeight + ")")
    .call(legendXAxis);

  //rectangles mapping

  svg
    .append("g")
    .attr("transform", "translate(" + padding + "," + paddingTop + ")")
    .selectAll("rect")
    .data(data.monthlyVariance)
    .enter()
    .append("rect")
    .attr("data-month", (d) => d.month)
    .attr("data-year", (d) => d.year)
    .attr("data-temp", (d) => data.baseTemperature + d.variance)
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => yScale(d.month))
    .attr("width", (d) => xScale.bandwidth(d.year))
    .attr("height", (d) => yScale.bandwidth(d.month))
    .attr("fill", (d) => legendThresholds(data.baseTemperature + d.variance))
    .on("mouseover", function (event, d) {
      var date = new Date(d.year, d.month);
      var str =
        "<span class='date'>" +
        d3.timeFormat("%B, %Y")(date) +
        "</span>" +
        "<br />" +
        "<span class='temperature'>" +
        d3.format(".1f")(data.baseTemperature + d.variance) +
        "°C" +
        "</span>" +
        "<br />" +
        "<span class='variance'>" +
        d3.format("+.1f")(d.variance) +
        "°C" +
        "</span>";
      tip.attr("data-year", d.year);
      tip.show(str, this);
    })
    .on("mouseout", tip.hide);
}
