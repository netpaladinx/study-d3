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
import { format as d3format } from "d3-format";
import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import {
  interpolate as d3interpolate,
  interpolateRgb as d3interpolateRgb,
} from "d3-interpolate";
import { transition as d3transition } from "d3-transition";
import { easeLinear as d3easeLinear } from "d3-ease";

import { useSvg, makeSvgInit, useDataFetch } from "./lib/d3-lib";

const width = 600;
const height = 600;
const duration = 2500;

const formatNumber = d3format(",d");
const parseNumber = (s) => +s.replace(/,/g, ""); // "+": convert a string to a number

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

  const layout = { treemap, root, sums, max };
  return layout;
};

const computeStyle = (data) => {
  const color = d3scaleOrdinal(
    data.children.map((d) => d.name),
    d3schemeCategory10.map((d) => d3interpolateRgb(d, "white")(0.5))
  );

  const style = { color };
  return style;
};

const drawBoxes = (svg, data, layout, style) => {
  const { root, max } = layout;
  const startIndex = 0;

  const box = svg
    .append("g")
    .selectAll("g")
    .data(
      // set data used by boxes
      data.keys
        .map((key, i) => {
          const value = root.sum((d) => (d.values ? d.values[i] : 0)).value; // sum over one key
          return { key, value, i, k: Math.sqrt(value / max) }; // area ratio => size ratio
        })
        .reverse()
    )
    .join("g")
    .attr(
      // set positions of boxes
      "transform",
      ({ k }) => `translate(${((1 - k) / 2) * width},${((1 - k) / 2) * height})`
    )
    .attr("opacity", ({ i }) => (i >= startIndex ? 1 : 0)) // determine display or hide for boxes
    .call((
      g // draw text for boxes
    ) =>
      g
        .append("text")
        .attr("y", -6)
        .attr("fill", "#777")
        .selectAll("tspan")
        .data(({ key, value }) => [key, `${formatNumber(value)}`])
        .join("tspan")
        .attr("font-weight", (d, i) => (i === 0 ? "bold" : null))
        .text((d) => d)
    )
    .call((
      g // draw rect for boxes
    ) =>
      g
        .append("rect")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("width", ({ k }) => k * width)
        .attr("height", ({ k }) => k * height)
    );

  return box;
};

const getLeaves = (index, layout) => {
  const { treemap, root, max } = layout;
  const k = Math.sqrt(
    root.sum((d) => (d.values ? d.values[index] : 0)).value / max
  );
  const x = ((1 - k) / 2) * width;
  const y = ((1 - k) / 2) * height;
  const leaves = treemap
    .size([width * k, height * k])(root)
    .each((d) => ((d.x0 += x), (d.x1 += x), (d.y0 += y), (d.y1 += y)))
    .leaves();
  return leaves;
};

const drawLeaves = (svg, data, layout, style) => {
  const { color } = style;
  const startIndex = 0;

  const leaf = svg
    .append("g")
    .selectAll("g")
    .data(getLeaves(startIndex, layout))
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  leaf
    .append("rect")
    .attr("id", (d, i) => (d.leafId = `leaf-${i}`))
    .attr("fill", (d) => {
      while (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  leaf
    .append("clipPath")
    .attr("id", (d, i) => (d.clipId = `clip-${i}`))
    .append("use")
    .attr("xlink:href", (d) => `#${d.leafId}`);

  leaf
    .append("text")
    .attr("clip-path", (d) => `url(#${d.clipId})`)
    .selectAll("span")
    .data((d) => [d.data.name, formatNumber(d.value)])
    .join("tspan")
    .attr("x", 3)
    .attr(
      "y",
      (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
    )
    .attr("fill-opacity", (d, i, nodes) =>
      i === nodes.length - 1 ? 0.7 : null
    )
    .text((d) => d);

  leaf.append("title").text((d) => d.data.name);

  return leaf;
};

const animate = (box, leaf, layout, style, movingIndex) => {
  box
    .transition()
    .duration(duration)
    .attr("opacity", ({ i }) => (i >= movingIndex ? 1 : 0));

  leaf
    .data(getLeaves(movingIndex, layout))
    .transition()
    .duration(duration)
    .ease(d3easeLinear)
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
    .call((leaf) =>
      leaf
        .select("rect")
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
    )
    .call((leaf) =>
      leaf.select("text tspan:last-child").tween("text", function (d) {
        const i = d3interpolate(parseNumber(this.textContent), d.value);
        return function (t) {
          this.textContent = formatNumber(i(t));
        };
      })
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

  /* Layout and style data */

  const [layout, style] = React.useMemo(() => {
    if (data) {
      return [computeLayout(data), computeStyle(data)];
    } else {
      return [];
    }
  }, [data]);

  /* Interaction or animation data */

  const [movingIndex, setMovingIdex] = React.useState(0);

  React.useEffect(() => {
    if (data && movingIndex < data.keys.length - 1) {
      const id = setInterval(
        () => setMovingIdex((movingIndex) => movingIndex + 1),
        duration
      );
      return () => clearInterval(id);
    }
  }, [data, movingIndex]);

  /* Draw based on data */

  const [box, setBox] = React.useState(null);
  const [leaf, setLeaf] = React.useState(null);

  React.useEffect(() => {
    if (svg && data && layout && style) {
      const box = drawBoxes(svg, data, layout, style);
      const leaf = drawLeaves(svg, data, layout, style);

      setBox(box);
      setLeaf(leaf);
    }
  }, [svg, data, layout, style]);

  React.useEffect(() => {
    if (box && leaf) {
      animate(box, leaf, layout, style, movingIndex);
    }
  }, [box, leaf, layout, style, movingIndex]);

  return <div ref={container}></div>;
};

export default AnimatedTreemap;
