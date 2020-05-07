import React from "react";
import { scaleLinear } from "d3-scale";
import { max } from "d3-array";

import { useSvg } from "./d3-lib/svg-hooks";

const initDraw = (svg) => {
  const data = [
    { year: 2006, books: 54 },
    { year: 2007, books: 43 },
    { year: 2008, books: 41 },
    { year: 2009, books: 44 },
    { year: 2010, books: 35 },
  ];
  const barWidth = 40;
  const width = (barWidth + 10) * data.length;
  const height = 200;
  const paddingBottom = 40;

  svg.attr("width", width).attr("height", height + paddingBottom);

  const x = scaleLinear().domain([0, data.length]).range([0, width]);
  const y = scaleLinear()
    .domain([
      0,
      max(data, function (d) {
        return d.books;
      }),
    ])
    .rangeRound([0, height]);

  svg
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function (d, i) {
      return x(i);
    })
    .attr("y", function (d) {
      return height - y(d.books);
    })
    .attr("height", function (d) {
      return y(d.books);
    })
    .attr("width", barWidth)
    .attr("fill", "#2d578b");

  svg
    .selectAll("text")
    .data(data)
    .enter()
    .append("text")
    .attr("x", function (d, i) {
      return x(i);
    })
    .attr("y", function (d) {
      return height - y(d.books);
    })
    .attr("dx", barWidth / 2)
    .attr("dy", "1.2em")
    .attr("text-anchor", "middle")
    .text(function (d) {
      return d.books;
    })
    .attr("fill", "white");

  svg
    .selectAll("text.axis")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "axis")
    .attr("x", function (d, i) {
      return x(i);
    })
    .attr("y", height)
    .attr("dx", barWidth / 2)
    .attr("text-anchor", "middle")
    .attr("style", "font-size: 12; font-family: Helvetica, sans-serif")
    .text(function (d) {
      return d.year;
    })
    .attr("transform", "translate(0, 18)");

  return svg;
};

const SimpleBarChart = (props) => {
  const [container] = useSvg({ initDraw });
  return <div ref={container}></div>;
};

export default SimpleBarChart;
