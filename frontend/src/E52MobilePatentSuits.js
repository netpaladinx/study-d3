/*
/data/suits.csv's schema:
  [{source: String, target: String, type: String}]
*/
import React from "react";

import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import { event as d3event } from "d3-selection";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import {
  forceSimulation as d3forceSimulation,
  forceLink as d3forceLink,
  forceManyBody as d3forceManyBody,
  forceX as d3forceX,
  forceY as d3forceY,
} from "d3-force";
import { drag as d3drag } from "d3-drag";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 600;

const init = makeSvgInit({
  width,
  height,
  attrs: {
    viewBox: [-width / 2, -height / 2, width, height],
  },
  styles: {
    font: "12px sans-serif",
  },
});

const computeParams = (linksData) => {
  const types = Array.from(new Set(linksData.map((d) => d.type)));
  const data = {
    nodes: Array.from(
      new Set(linksData.flatMap((l) => [l.source, l.target])),
      (id) => ({ id })
    ),
    links: linksData,
  };
  const color = d3scaleOrdinal(types, d3schemeCategory10);

  function linkArc(d) {
    const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
    return `
      M${d.source.x},${d.source.y}
      A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
    `;
  }

  const drag = (simulation) => {
    function dragstarted(d) {
      if (!d3event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3event.x;
      d.fy = d3event.y;
    }

    function dragended(d) {
      if (!d3event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  const links = data.links.map((d) => Object.create(d));
  const nodes = data.nodes.map((d) => Object.create(d));

  const simulation = d3forceSimulation(nodes)
    .force(
      "link",
      d3forceLink(links).id((d) => d.id)
    )
    .force("charge", d3forceManyBody().strength(-400))
    .force("x", d3forceX())
    .force("y", d3forceY());

  return { color, types, links, nodes, drag, simulation, linkArc };
};

const draw = (svg, params) => {
  const { color, types, links, nodes, drag, simulation, linkArc } = params;

  // Per-type markers, as they don't inherit styles.
  svg
    .append("defs")
    .selectAll("marker")
    .data(types)
    .join("marker")
    .attr("id", (d) => `arrow-${d}`)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -0.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("fill", color)
    .attr("d", "M0,-5L10,0L0,5");

  const link = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("stroke", (d) => color(d.type))
    .attr("marker-end", (d) => `url(#arrow-${d.type})`);

  const node = svg
    .append("g")
    .attr("fill", "currentColor")
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(drag(simulation));

  node
    .append("circle")
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)
    .attr("r", 4);

  node
    .append("text")
    .attr("x", 8)
    .attr("y", "0.31em")
    .text((d) => d.id)
    .clone(true)
    .lower()
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 3);

  simulation.on("tick", () => {
    link.attr("d", linkArc);
    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });
};

const MobilePatentSuits = (props) => {
  const [container, svg] = useSvg(init);

  const [links] = useDataFetchMemo("/data/suits.csv");
  console.log(links);

  const params = React.useMemo(() => callIfReady(computeParams, links), [
    links,
  ]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default MobilePatentSuits;
