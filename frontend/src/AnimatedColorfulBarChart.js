import React from "react";
import { select } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { max, range } from "d3-array";
import { transition } from "d3-transition";
import { easeElastic } from "d3-ease";
import { axisLeft, axisBottom } from "d3-axis";

import { useSvg } from "./d3-lib/svg-hooks";

const initDraw = (svg) => {
  const chardata = [
    410,
    370,
    330,
    270,
    240,
    220,
    200,
    180,
    165,
    150,
    135,
    130,
    135,
    150,
    165,
    180,
    200,
    220,
    240,
    270,
    300,
    330,
    370,
    410,
  ];

  const margin = { top: 30, right: 10, bottom: 30, left: 50 };

  const height = 400 - margin.top - margin.bottom;
  const width = 720 - margin.left - margin.right;

  const yScale = scaleLinear()
    .domain([0, max(chardata)])
    .range([0, height]);

  const xScale = scaleBand()
    .domain(range(0, chardata.length))
    .range([0, width])
    .paddingOuter(0.5)
    .paddingInner(0.1);

  const colors = scaleLinear()
    .domain([
      0,
      chardata.length * (1 / 3),
      chardata.length * (2 / 3),
      chardata.length,
    ])
    .range(["#d6e9c6", "#bce8f1", "#faebcc", "#ebccd1"]);

  let dynamicColor;

  svg
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background", "#bce8f1");

  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .selectAll("rect")
    .data(chardata)
    .enter()
    .append("rect")
    .style("fill", function (d, i) {
      return colors(i);
    })
    .style("stroke", "#31708f")
    .style("stroke-width", 5)
    .attr("width", xScale.bandwidth())
    .attr("height", 0)
    .attr("x", function (d, i) {
      return xScale(i);
    })
    .attr("y", height)
    .on("mouseover", function (d) {
      dynamicColor = this.style.fill;
      select(this).style("fill", "#3c763d");
    })
    .on("mouseout", function (d) {
      select(this).style("fill", dynamicColor);
    })
    .transition()
    .delay(function (d, i) {
      return i * 20;
    })
    .duration(2000)
    .attr("height", function (d) {
      return yScale(d);
    })
    .attr("y", function (d) {
      return height - yScale(d);
    })
    .ease(easeElastic);

  const yAxisScale = scaleLinear()
    .domain([0, max(chardata)])
    .range([height, 0]);

  const yAxis = axisLeft().scale(yAxisScale).ticks(10);

  const yAxisG = svg.append("g");

  yAxis(yAxisG);
  yAxisG.attr("transform", `translate(${margin.left},${margin.top})`);
  yAxisG.selectAll("path").style("fill", "none").style("stroke", "#3c763d");
  yAxisG.selectAll("line").style("stroke", "#3c763d");

  const xAxis = axisBottom().scale(xScale).ticks(chardata.length);

  const xAxisG = svg.append("g");
  xAxis(xAxisG);
  xAxisG.attr("transform", `translate(${margin.left},${height + margin.top})`);
  xAxisG.selectAll("path").style("fill", "none").style("stroke", "#3c763d");
  xAxisG.selectAll("line").style("stroke", "#3c763d");

  return svg;
};

const AnimatedColorfulBarChart = (props) => {
  const [container] = useSvg({ initDraw });

  return <div ref={container}></div>;
};

export default AnimatedColorfulBarChart;
