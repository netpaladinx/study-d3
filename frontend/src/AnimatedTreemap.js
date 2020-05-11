// https://observablehq.com/@d3/animated-treemap

import React from "react";

import {
  range as d3range,
  sum as d3sum,
  ascending as d3ascending,
  max as d3max,
} from "d3-array";
import { nest as d3nest } from "d3-collection";
import {
  treemap as d3treemap,
  treemapResquarify as d3treemapResquarify,
  hierarchy as d3hierarchy,
} from "d3-hierarchy";

import { useSvg, makeSvgInit, useDataFetch } from "./lib/d3-lib";

const width = 600;
const height = 600;

const init = makeSvgInit({
  width,
  height,
  attrs: {
    viewBox: `0 -20 ${width} ${height + 20}`,
    "font-family": "sans-serif",
    "font-size": 10,
  },
  styles: {
    overflow: "visible",
  },
  draw: (svg) => svg,
});

const computeData = (regionsInput, statesInput) => {
  const keys = d3range(1790, 2000, 10);

  const regions = regionsInput;

  const states = statesInput
    .map((d, i) =>
      i === 0
        ? null
        : {
            name: d[""],
            values: keys.map((key) => +d[key].replace(/,/g, "") || 1e-6), // how to replace a character globally
          }
    )
    .filter((d) => d); // how to map null and filter

  const regionByState = new Map(regions.map((d) => [d.State, d.Region])); // how to create a map
  const divisionByState = new Map(regions.map((d) => [d.State, d.Division]));

  const key1 = (d) => regionByState.get(d.name);
  const key2 = (d) => divisionByState.get(d.name);
  const hierarchy = ({ key, values }, depth) => {
    return {
      name: key,
      children:
        depth < 2 - 1 ? values.map((d) => hierarchy(d, depth + 1)) : values, // how to use a recursive function to access a tree
    };
  };
  const children = d3nest()
    .key(key1)
    .sortKeys(d3ascending)
    .key(key2)
    .sortKeys(d3ascending)
    .entries(states)
    .map((d) => hierarchy(d, 0)); // how to create a tree-structured data

  const data = { keys, children };
  return data;
};

const computeLayout = (data) => {
  const treemap = d3treemap()
    .tile(d3treemapResquarify)
    .size([width, height])
    .padding((d) => (d.height === 1 ? 1 : 0)) // heights: 3 (root) -> 2 (region) -> 1 (division) -> 0 (leaf) (but here only scan 3,2,1)
    .round(true);

  // 1. how to create a tree from `data`, with each node containing associated `data`, `height`, `depth`, `parent`, `children`
  // 2. how to evaluate value on each node by summing over `data` of its children and itself, creating a property `value`
  // 3. how to sort children under each parent
  // 4. how to get a treemap layout by a nested data ({name, children})
  const root = treemap(
    d3hierarchy(data)
      .sum((d) => (d.values ? d3sum(d.values) : 0)) // sum over all keys
      .sort((a, b) => b.value - a.value)
  );

  const sums = data.keys.map(
    (d, i) =>
      d3hierarchy(data).sum((d) => (d.values ? Math.round(d.values[i]) : 0))
        .value
  );
  const max = d3max(sums);

  const layout = { root, sums, max };
  return layout;
};

const drawBox = (svg, data, layout) => {
  console.log(layout);

  const { root, max } = layout;

  svg
    .append("g")
    .selectAll("g")
    .data(
      data.keys
        .map((key, i) => {
          const value = root.sum((d) => (d.values ? d.values[i] : 0)).value; // sum over one key
          return { key, value, i, k: Math.sqrt(value / max) };
        })
        .reverse()
    )
    .join("g")
    .attr(
      "transform",
      ({ k }) => `translate(${((1 - k) / 2) * width},${((1 - k) / 2) * height})`
    );
};

const AnimatedTreemap = (props) => {
  const [container, svg] = useSvg(init);

  /* Loaded data */

  const [regionsResult] = useDataFetch("/data/census-regions.csv"); // how to do asynchronous fetching
  const [statesResult] = useDataFetch("/data/population.tsv");

  /* Processed data */

  const data = React.useMemo(() => {
    if (
      !regionsResult.isLoading &&
      !regionsResult.isError &&
      !statesResult.isLoading &&
      !statesResult.isError &&
      regionsResult.data &&
      statesResult.data
    ) {
      return computeData(regionsResult.data, statesResult.data);
    } else {
      return null;
    }
  }, [regionsResult, statesResult]);

  /* Layout data */

  const layout = React.useMemo(() => {
    if (data) {
      return computeLayout(data);
    } else {
      return null;
    }
  }, [data]);

  /* Draw based on data */

  React.useEffect(() => {
    if (svg && data && layout) {
      drawBox(svg, data, layout);
    }
    console.log("useEffect");
  }, [svg, data, layout]);

  return <div ref={container}></div>;
};

export default AnimatedTreemap;
