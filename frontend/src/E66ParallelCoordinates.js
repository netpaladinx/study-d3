import React from "react";

import { select as d3select } from "d3-selection";
import {
  extent as d3extent,
  cross as d3cross,
  ascending as d3ascending,
} from "d3-array";
import { axisBottom as d3axisBottom } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scalePoint as d3scalePoint,
  scaleSequential as d3scaleSequential,
} from "d3-scale";
import { interpolateBrBG as d3interpolateBrBG } from "d3-scale-chromatic";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";
import { line as d3line } from "d3-shape";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const margin = { top: 20, right: 20, bottom: 30, left: 30 };

const init = makeSvgInit({
  width,
  height: null,
});

const computeParams = (data, keyz) => {
  const keys = data.columns.slice(1);

  const height = keys.length * 120;

  const x = new Map(
    Array.from(keys, (key) => [
      key,
      d3scaleLinear(
        d3extent(data, (d) => d[key]),
        [margin.left, width - margin.right]
      ),
    ])
  );

  const y = d3scalePoint(keys, [margin.top, height - margin.bottom]);

  const z = d3scaleSequential(
    x.get(keyz).domain().reverse(),
    d3interpolateBrBG
  );

  return { height, keys, x, y, z };
};

const draw = (svg, data, keyz, params) => {
  svg.clear();

  const { height, keys, x, y, z } = params;

  svg.attr("height", height);

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(data.slice().sort((a, b) => d3ascending(a[keyz], b[keyz])))
    .join("path")
    .attr("stroke", (d) => z(d[keyz]))
    .attr("stroke-opacity", 0.4)
    .attr("d", (d) =>
      d3line()
        .defined(([, value]) => value != null)
        .x(([key, value]) => x.get(key)(value))
        .y(([key]) => y(key))(d3cross(keys, [d], (key, d) => [key, d[key]]))
    )
    .append("title")
    .text((d) => d.name);

  svg
    .append("g")
    .selectAll("g")
    .data(keys)
    .join("g")
    .attr("transform", (d) => `translate(0,${y(d)})`)
    .each(function (d) {
      d3select(this).call(d3axisBottom(x.get(d)));
    })
    .call((g) =>
      g
        .append("text")
        .attr("x", margin.left)
        .attr("y", -6)
        .attr("text-anchor", "start")
        .attr("fill", "currentColor")
        .text((d) => d)
    )
    .call((g) =>
      g
        .selectAll("text")
        .clone(true)
        .lower()
        .attr("fill", "none")
        .attr("stroke-width", 5)
        .attr("stroke-linejoin", "round")
        .attr("stroke", "white")
    );
};

const ParallelCoordinates = (props) => {
  const [keyz, setKeyz] = React.useState("weight (lb)");

  const handleChange = (event) => {
    setKeyz(event.target.value);
  };

  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/cars.csv", (text) =>
    d3csvParse(text, d3autoType)
  );

  const params = React.useMemo(() => callIfReady(computeParams, data, keyz), [
    data,
    keyz,
  ]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, keyz, params);
  }, [svg, data, keyz, params]);

  return (
    <React.Fragment>
      <form>
        <select value={keyz} onChange={handleChange}>
          <option value="economy (mpg)">economy (mpg)</option>
          <option value="cylinders">cylinders</option>
          <option value="displacement (cc)">displacement (cc)</option>
          <option value="power (hp)">power (hp)</option>
          <option value="weight (lb)">weight (lb)</option>
          <option value="0-60 mph (s)">0-60 mph (s)</option>
          <option value="year">year</option>
        </select>
        <i>&nbsp;color encoding</i>
      </form>
      <div ref={container}></div>
    </React.Fragment>
  );
};

export default ParallelCoordinates;
