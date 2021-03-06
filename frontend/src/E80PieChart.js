import React from "react";

import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import { quantize as d3quantize } from "d3-interpolate";
import { interpolateSpectral as d3interpolateSpectral } from "d3-scale-chromatic";
import { arc as d3arc, pie as d3pie } from "d3-shape";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = Math.min(width, 500);

const init = makeSvgInit({
  width,
  height,
  attrs: {
    viewBox: [-width / 2, -height / 2, width, height],
  },
});

const computeParams = (data) => {
  const color = d3scaleOrdinal()
    .domain(data.map((d) => d.name))
    .range(
      d3quantize(
        (t) => d3interpolateSpectral(t * 0.8 + 0.1),
        data.length
      ).reverse()
    );

  const arc = d3arc()
    .innerRadius(0)
    .outerRadius(Math.min(width, height) / 2 - 1);

  const radius = (Math.min(width, height) / 2) * 0.8;
  const arcLabel = d3arc().innerRadius(radius).outerRadius(radius);

  const pie = d3pie()
    .sort(null)
    .value((d) => d.value);

  const arcs = pie(data);

  return { color, arcs, arc, arcLabel };
};

const draw = (svg, data, params) => {
  const { color, arcs, arc, arcLabel } = params;

  svg
    .append("g")
    .attr("stroke", "white")
    .selectAll("path")
    .data(arcs)
    .join("path")
    .attr("fill", (d) => color(d.data.name))
    .attr("d", arc)
    .append("title")
    .text((d) => `${d.data.name}: ${d.data.value.toLocaleString()}`);

  svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(arcs)
    .join("text")
    .attr("transform", (d) => `translate(${arcLabel.centroid(d)})`)
    .call((text) =>
      text
        .append("tspan")
        .attr("y", "-0.4em")
        .attr("font-weight", "bold")
        .text((d) => d.data.name)
    )
    .call((text) =>
      text
        .filter((d) => d.endAngle - d.startAngle > 0.25)
        .append("tspan")
        .attr("x", 0)
        .attr("y", "0.7em")
        .attr("fill-opacity", 0.7)
        .text((d) => d.data.value.toLocaleString())
    );
};

const PieChart = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/population-by-age.csv", (text) =>
    d3csvParse(text, d3autoType)
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default PieChart;
