import React from "react";

import {
  sankey as d3sankey,
  sankeyLinkHorizontal as d3sankeyLinkHorizontal,
} from "d3-sankey";
import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 975;
const height = 720;

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const color = d3scaleOrdinal(["Perished"], ["#da4f81"]).unknown("#ccc");
  const keys = data.columns.slice(0, -1);

  const sankey = d3sankey()
    .nodeSort(null)
    .linkSort(null)
    .nodeWidth(4)
    .nodePadding(20)
    .extent([
      [0, 5],
      [width, height - 5],
    ]);

  const graph = (function () {
    let index = -1;
    const nodes = [];
    const nodeByKey = new Map();
    const indexByKey = new Map();
    const links = [];

    for (const k of keys) {
      for (const d of data) {
        const key = JSON.stringify([k, d[k]]);
        if (nodeByKey.has(key)) continue;
        const node = { name: d[k] };
        nodes.push(node);
        nodeByKey.set(key, node);
        indexByKey.set(key, ++index);
      }
    }

    for (let i = 1; i < keys.length; ++i) {
      const a = keys[i - 1];
      const b = keys[i];
      const prefix = keys.slice(0, i + 1);
      const linkByKey = new Map();
      for (const d of data) {
        const names = prefix.map((k) => d[k]);
        const key = JSON.stringify(names);
        const value = d.value || 1;
        let link = linkByKey.get(key);
        if (link) {
          link.value += value;
          continue;
        }
        link = {
          source: indexByKey.get(JSON.stringify([a, d[a]])),
          target: indexByKey.get(JSON.stringify([b, d[b]])),
          names,
          value,
        };
        links.push(link);
        linkByKey.set(key, link);
      }
    }

    return { nodes, links };
  })();

  return { keys, sankey, color, graph };
};

const draw = (svg, params) => {
  const { sankey, color, graph } = params;

  const { nodes, links } = sankey({
    nodes: graph.nodes.map((d) => Object.assign({}, d)),
    links: graph.links.map((d) => Object.assign({}, d)),
  });

  svg
    .append("g")
    .selectAll("rect")
    .data(nodes)
    .join("rect")
    .attr("x", (d) => d.x0)
    .attr("y", (d) => d.y0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("width", (d) => d.x1 - d.x0)
    .append("title")
    .text((d) => `${d.name}\n${d.value.toLocaleString()}`);

  svg
    .append("g")
    .attr("fill", "none")
    .selectAll("g")
    .data(links)
    .join("path")
    .attr("d", d3sankeyLinkHorizontal())
    .attr("stroke", (d) => color(d.names[0]))
    .attr("stroke-width", (d) => d.width)
    .style("mix-blend-mode", "multiply")
    .append("title")
    .text((d) => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);

  svg
    .append("g")
    .style("font", "10px sans-serif")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
    .attr("y", (d) => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", (d) => (d.x0 < width / 2 ? "start" : "end"))
    .text((d) => d.name)
    .append("tspan")
    .attr("fill-opacity", 0.7)
    .text((d) => ` ${d.value.toLocaleString()}`);
};

const ParallelSets = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/titanic.csv", (text) =>
    d3csvParse(text, d3autoType)
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default ParallelSets;
