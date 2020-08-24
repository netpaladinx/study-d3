import React from "react";

import { descending as d3descending } from "d3-array";
import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { chord as d3chord, ribbon as d3ribbon } from "d3-chord";
import { arc as d3arc } from "d3-shape";
import { rgb as d3rgb } from "d3-color";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = width;

const init = makeSvgInit({
  width,
  height,
  attrs: {
    viewBox: [-width / 2, -height / 2, width, height],
    "font-size": 10,
    "font-family": "sans-serif",
  },
});

const computeParams = (ds) => {
  const outerRadius = Math.min(width, height) * 0.5;
  const innerRadius = outerRadius - 124;

  const indexByName = new Map();
  const nameByIndex = new Map();
  const matrix = [];
  let n = 0;

  // Returns the Flare package name for the given class name.
  function name(name) {
    return name.substring(0, name.lastIndexOf(".")).substring(6);
  }

  // Compute a unique index for each package name.
  ds.forEach((d) => {
    if (!indexByName.has((d = name(d.name)))) {
      nameByIndex.set(n, d);
      indexByName.set(d, n++);
    }
  });

  // Construct a square matrix counting package imports.
  ds.forEach((d) => {
    const source = indexByName.get(name(d.name));
    let row = matrix[source];
    if (!row) row = matrix[source] = Array.from({ length: n }).fill(0);
    d.imports.forEach((d) => row[indexByName.get(name(d))]++);
  });

  const data = {
    matrix,
    indexByName,
    nameByIndex,
  };

  const chord = d3chord()
    .padAngle(0.04)
    .sortSubgroups(d3descending)
    .sortChords(d3descending);

  const arc = d3arc()
    .innerRadius(innerRadius)
    .outerRadius(innerRadius + 20);

  const ribbon = d3ribbon().radius(innerRadius);

  const color = d3scaleOrdinal(d3schemeCategory10);

  const chords = chord(data.matrix);

  return { data, innerRadius, arc, ribbon, chords, color };
};

const draw = (svg, params) => {
  const { data, innerRadius, arc, ribbon, chords, color } = params;

  const group = svg.append("g").selectAll("g").data(chords.groups).join("g");

  group
    .append("path")
    .attr("fill", (d) => color(d.index))
    .attr("stroke", (d) => color(d.index))
    .attr("d", arc);

  group
    .append("text")
    .each((d) => {
      d.angle = (d.startAngle + d.endAngle) / 2;
    })
    .attr("dy", ".35em")
    .attr(
      "transform",
      (d) => `
      rotate(${(d.angle * 180) / Math.PI - 90})
      translate(${innerRadius + 26})
      ${d.angle > Math.PI ? "rotate(180)" : ""}
    `
    )
    .attr("text-anchor", (d) => (d.angle > Math.PI ? "end" : null))
    .text((d) => data.nameByIndex.get(d.index));

  svg
    .append("g")
    .attr("fill-opacity", 0.67)
    .selectAll("path")
    .data(chords)
    .join("path")
    .attr("stroke", (d) => d3rgb(color(d.source.index)).darker())
    .attr("fill", (d) => color(d.source.index))
    .attr("d", ribbon);
};

const ChordDependencyDiagram = (props) => {
  const [container, svg] = useSvg(init);

  const [source] = useDataFetchMemo("/data/flare.json");

  const params = React.useMemo(() => callIfReady(computeParams, source), [
    source,
  ]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default ChordDependencyDiagram;
