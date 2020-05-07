// https://observablehq.com/@d3/animated-treemap

import React from "react";

import { range as d3range, sum as d3sum } from "d3-array";
import { nest as d3nest } from "d3-collection";
import { ascending as d3ascending } from "d3-array";
import {
  treemap as d3treemap,
  treemapResquarify as d3treemapResquarify,
  hierarchy as d3hierarchy,
} from "d3-hierarchy";

import { useSvg } from "./d3-lib/svg-hooks";
import { useDataApi } from "./d3-lib/fetch-hooks";

const initDraw = (svg) => {
  return svg;
};

const width = 600;
const height = 600;

const AnimatedTreemap = (props) => {
  const [container] = useSvg({ width, height, initDraw });

  /* loaded data */

  const [regionsResult] = useDataApi({ url: "/data/census-regions.csv" });
  const [statesResult] = useDataApi({ url: "/data/population.tsv" });

  const keys = React.useMemo(() => d3range(1790, 2000, 10), []);
  const regions = regionsResult.data;
  const states = React.useMemo(
    () =>
      statesResult.data &&
      statesResult.data
        .map((d, i) =>
          i === 0
            ? null
            : {
                name: d[""],
                values: keys.map((key) => +d[key].replace(/,/g, "") || 1e-6), // how to replace a character globally
              }
        )
        .filter((d) => d),
    [statesResult.data, keys]
  ); // how to map null and filter

  const regionByState = React.useMemo(
    () => new Map(regions && regions.map((d) => [d.State, d.Region])),
    [regions]
  ); // how to create a map
  const divisionByState = React.useMemo(
    () => new Map(regions && regions.map((d) => [d.State, d.Division])),
    [regions]
  );
  const children = React.useMemo(() => {
    const hierarchy = ({ key, values }, depth) => {
      return {
        name: key,
        children:
          depth < 1 ? values.map((d) => hierarchy(d, depth + 1)) : values,
      };
    };

    return (
      regions &&
      states &&
      d3nest()
        .key((d) => regionByState.get(d.name))
        .sortKeys(d3ascending)
        .key((d) => divisionByState.get(d.name))
        .sortKeys(d3ascending)
        .entries(states)
        .map((d) => hierarchy(d, 0))
    );
  }, [regions, states, regionByState, divisionByState]); // how to create a tree-structured data

  const data = { keys, children };

  /* data for visualization */

  const treemap = d3treemap()
    .tile(d3treemapResquarify)
    .size([width, height])
    .padding((d) => (d.height === 1 ? 1 : 0)) // heights: 3 (root) -> 2 (region) -> 1 (division) -> 0 (leaf) (but here only scan 3,2,1)
    .round(true);

  // 1. how to create a tree from `data`, with each node containing associated `data`, `height`, `depth`, `parent`, `children`
  // 2. how to evaluate value on each node by `sum`
  // 3. how to sort children under each parent
  // 4. how to get a treemap layout by a nested data
  const root = treemap(
    d3hierarchy(data)
      .sum((d) => (d.values ? d3sum(d.values) : 0))
      .sort((a, b) => b.value - a.value)
  );

  console.log(root);

  return <div ref={container}></div>;
};

export default AnimatedTreemap;
