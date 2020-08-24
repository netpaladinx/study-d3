import React from "react";

import {
  axisTop as d3axisTop,
  axisBottom as d3axisBottom,
  axisRight as d3axisRight,
  axisLeft as d3axisLeft,
} from "d3-axis";
import { scaleLinear as d3scaleLinear, scaleLog as d3scaleLog } from "d3-scale";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = Math.round(width * 1.2);
const margin = { top: 40, right: 40, bottom: 40, left: 40 };

const init = makeSvgInit({
  width,
  height,
  attrs: {
    viewBox: [-14, 0, width + 28, height],
    fill: "currentColor",
    "font-family": "sans-serif",
    "font-size": 10,
  },
  styles: {
    margin: "0 -14px",
    background: "#000",
    color: "#fff",
    display: "block",
  },
});

function bv2rgb(bv) {
  bv = Math.max(-0.4, Math.min(2, bv));
  let t;
  return `#${[
    bv < 0
      ? ((t = (bv + 0.4) / 0.4), 0.61 + 0.11 * t + 0.1 * t * t)
      : bv < 0.4
      ? ((t = bv / 0.4), 0.83 + 0.17 * t)
      : 1,
    bv < 0
      ? ((t = (bv + 0.4) / 0.4), 0.7 + 0.07 * t + 0.1 * t * t)
      : bv < 0.4
      ? ((t = bv / 0.4), 0.87 + 0.11 * t)
      : bv < 1.6
      ? ((t = (bv - 0.4) / 1.2), 0.98 - 0.16 * t)
      : ((t = (bv - 1.6) / 0.4), 0.82 - 0.5 * t * t),
    bv < 0.4
      ? 1
      : bv < 1.5
      ? ((t = (bv - 0.4) / 1.1), 1 - 0.47 * t + 0.1 * t * t)
      : bv < 1.94
      ? ((t = (bv - 1.5) / 0.44), 0.63 - 0.6 * t * t)
      : 0,
  ]
    .map((t) =>
      Math.round(t * 255)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

function temperature(color) {
  return 4600 * (1 / (0.92 * color + 1.7) + 1 / (0.92 * color + 0.62));
}

const computeParams = (data) => {
  const x = d3scaleLinear([-0.39, 2.19], [margin.left, width - margin.right]);
  const y = d3scaleLinear([-7, 19], [margin.top, height - margin.bottom]);
  const z = bv2rgb;
  return { x, y, z };
};

const draw = (svg, data, params) => {
  const { x, y, z } = params;

  svg
    .append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (d) => x(d.color))
    .attr("y", (d) => y(d.absolute_magnitude))
    .attr("fill", (d) => z(d.color))
    .attr("width", 0.75)
    .attr("height", 0.75);

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3axisLeft(
        d3scaleLog(
          y.domain().map((m) => Math.pow(10, 4.83 - m)),
          y.range()
        )
      )
    );

  svg
    .append("g")
    .attr("transform", `translate(${width - margin.right},0)`)
    .call(d3axisRight(y).ticks(null, "+"));

  svg
    .append("g")
    .attr("transform", `translate(0,${margin.top})`)
    .call(d3axisTop(d3scaleLinear(x.domain().map(temperature), x.range())));

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3axisBottom(x).ticks(null, "+f"));

  svg.selectAll(".domain").remove();

  svg
    .append("text")
    .attr("dy", 12)
    .attr("text-anchor", "middle")
    .attr(
      "transform",
      `translate(${margin.left},${
        (margin.top + height - margin.bottom) / 2
      }) rotate(-90)`
    )
    .call((text) =>
      text.append("tspan").attr("fill-opacity", 0.8).text("← darker\xa0")
    )
    .call((text) =>
      text
        .append("tspan")
        .attr("font-weight", "bold")
        .text("\xa0Luminosity L☉\xa0")
    )
    .call((text) =>
      text.append("tspan").attr("fill-opacity", 0.8).text("\xa0brighter →")
    );

  svg
    .append("text")
    .attr("dy", -6)
    .attr("text-anchor", "middle")
    .attr(
      "transform",
      `translate(${width - margin.right},${
        (margin.top + height - margin.bottom) / 2
      }) rotate(-90)`
    )
    .call((text) =>
      text.append("tspan").attr("fill-opacity", 0.8).text("← darker\xa0")
    )
    .call((text) =>
      text
        .append("tspan")
        .attr("font-weight", "bold")
        .text("\xa0Absolute magnitude M\xa0")
    )
    .call((text) =>
      text.append("tspan").attr("fill-opacity", 0.8).text("\xa0brighter →")
    );

  svg
    .append("text")
    .attr("x", (margin.left + width - margin.right) / 2)
    .attr("y", margin.top)
    .attr("dy", 12)
    .attr("text-anchor", "middle")
    .call((text) =>
      text.append("tspan").attr("fill-opacity", 0.8).text("← hotter\xa0")
    )
    .call((text) =>
      text
        .append("tspan")
        .attr("font-weight", "bold")
        .text("\xa0Temperature K\xa0")
    )
    .call((text) =>
      text.append("tspan").attr("fill-opacity", 0.8).text("\xa0colder →")
    );

  svg
    .append("text")
    .attr("x", (margin.left + width - margin.right) / 2)
    .attr("y", height - margin.bottom)
    .attr("dy", -6)
    .attr("text-anchor", "middle")
    .call((text) =>
      text.append("tspan").attr("fill-opacity", 0.8).text("← blue\xa0")
    )
    .call((text) =>
      text.append("tspan").attr("font-weight", "bold").text("\xa0Color B-V\xa0")
    )
    .call((text) =>
      text.append("tspan").attr("fill-opacity", 0.8).text("\xa0red →")
    );
};

const HertzsprungRussellDiagram = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/catalog.csv", (text) =>
    d3csvParse(text, d3autoType)
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default HertzsprungRussellDiagram;
