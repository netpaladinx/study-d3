import React from "react";

import { format as d3format } from "d3-format";
import { hierarchy as d3hierarchy } from "d3-hierarchy";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const nodeSize = 17;
const format = d3format(",");

const init = makeSvgInit({
  width: null,
  height: null,
});

const computeParams = (data) => {
  let i = 0;
  const root = d3hierarchy(data).eachBefore((d) => (d.index = i++));

  const columns = [
    {
      label: "Size",
      value: (d) => d.value,
      format,
      x: 280,
    },
    {
      label: "Count",
      value: (d) => (d.children ? 0 : 1),
      format: (value, d) => (d.children ? format(value) : "-"),
      x: 340,
    },
  ];

  const nodes = root.descendants();

  return { root, columns, nodes };
};

const draw = (svg, data, params) => {
  const { root, columns, nodes } = params;

  svg
    .attr("viewBox", [
      -nodeSize / 2,
      (-nodeSize * 3) / 2,
      width,
      (nodes.length + 1) * nodeSize,
    ])
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .style("overflow", "visible");

  const link = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#999")
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr(
      "d",
      (d) => `
        M${d.source.depth * nodeSize},${d.source.index * nodeSize}
        V${d.target.index * nodeSize}
        h${nodeSize}
      `
    );

  const node = svg
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("transform", (d) => `translate(0,${d.index * nodeSize})`);

  node
    .append("circle")
    .attr("cx", (d) => d.depth * nodeSize)
    .attr("r", 2.5)
    .attr("fill", (d) => (d.children ? null : "#999"));

  node
    .append("text")
    .attr("dy", "0.32em")
    .attr("x", (d) => d.depth * nodeSize + 6)
    .text((d) => d.data.name);

  node.append("title").text((d) =>
    d
      .ancestors()
      .reverse()
      .map((d) => d.data.name)
      .join("/")
  );

  for (const { label, value, format, x } of columns) {
    svg
      .append("text")
      .attr("dy", "0.32em")
      .attr("y", -nodeSize)
      .attr("x", x)
      .attr("text-anchor", "end")
      .attr("font-weight", "bold")
      .text(label);

    node
      .append("text")
      .attr("dy", "0.32em")
      .attr("x", x)
      .attr("text-anchor", "end")
      .attr("fill", (d) => (d.children ? null : "#555"))
      .data(root.copy().sum(value).descendants())
      .text((d) => format(d.value, d));
  }
};

const IndentedTree = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/flare-2.json");

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default IndentedTree;
