import React from "react";

import { sum as d3sum, ascending as d3ascending } from "d3-array";
import {
  scaleOrdinal as d3scaleOrdinal,
  scalePoint as d3scalePoint,
} from "d3-scale";
import { interpolateNumber as d3interpolateNumber } from "d3-interpolate";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { lab as d3lab } from "d3-color";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;

const init = makeSvgInit({
  width: null,
  height: null,
});

const orders = [
  (a, b) => d3ascending(a.id, b.id),
  (a, b) => a.group - b.group || d3ascending(a.id, b.id),
  (a, b) =>
    d3sum(b.sourceLinks, (l) => l.value) +
      d3sum(b.targetLinks, (l) => l.value) -
      d3sum(a.sourceLinks, (l) => l.value) -
      d3sum(a.targetLinks, (l) => l.value) || d3ascending(a.id, b.id),
];

const computeParams = (data) => {
  const margin = { top: 20, right: 20, bottom: 20, left: 100 };
  const step = 14;

  const height = (data.nodes.length - 1) * step + margin.top + margin.bottom;

  const nodes = data.nodes.map(({ id, group }) => ({
    id,
    sourceLinks: [],
    targetLinks: [],
    group,
  }));

  const nodeById = new Map(nodes.map((d) => [d.id, d]));

  const links = data.links.map(({ source, target, value }) => ({
    source: nodeById.get(source),
    target: nodeById.get(target),
    value,
  }));

  for (const link of links) {
    const { source, target, value } = link;
    source.sourceLinks.push(link);
    target.targetLinks.push(link);
  }

  const graph = { nodes, links };

  const y = d3scalePoint(graph.nodes.map((d) => d.id).sort(d3ascending), [
    margin.top,
    height - margin.bottom,
  ]);

  const color = d3scaleOrdinal(
    graph.nodes.map((d) => d.group).sort(d3ascending),
    d3schemeCategory10
  );

  const arc = (d) => {
    const y1 = d.source.y;
    const y2 = d.target.y;
    const r = Math.abs(y2 - y1) / 2;
    return `M${margin.left},${y1}A${r},${r} 0,0,${y1 < y2 ? 1 : 0} ${
      margin.left
    },${y2}`;
  };

  return { step, height, margin, color, graph, y, arc };
};

const draw = (svg, params) => {
  const { step, height, margin, color, graph, y, arc } = params;

  svg.attr("width", width).attr("height", height);

  svg.append("style").text(`

.hover path {
  stroke: #ccc;
}

.hover text {
  fill: #ccc;
}

.hover g.primary text {
  fill: black;
  font-weight: bold;
}

.hover g.secondary text {
  fill: #333;
}

.hover path.primary {
  stroke: #333;
  stroke-opacity: 1;
}

`);

  const label = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(graph.nodes)
    .join("g")
    .attr("transform", (d) => `translate(${margin.left},${(d.y = y(d.id))})`)
    .call((g) =>
      g
        .append("text")
        .attr("x", -6)
        .attr("dy", "0.35em")
        .attr("fill", (d) => d3lab(color(d.group)).darker(2))
        .text((d) => d.id)
    )
    .call((g) =>
      g
        .append("circle")
        .attr("r", 3)
        .attr("fill", (d) => color(d.group))
    );

  const path = svg
    .insert("g", "*")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(graph.links)
    .join("path")
    .attr("stroke", (d) =>
      d.source.group === d.target.group ? color(d.source.group) : "#aaa"
    )
    .attr("d", arc);

  const overlay = svg
    .append("g")
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .selectAll("rect")
    .data(graph.nodes)
    .join("rect")
    .attr("width", margin.left + 40)
    .attr("height", step)
    .attr("y", (d) => y(d.id) - step / 2)
    .on("mouseover", (d) => {
      svg.classed("hover", true);
      label.classed("primary", (n) => n === d);
      label.classed(
        "secondary",
        (n) =>
          n.sourceLinks.some((l) => l.target === d) ||
          n.targetLinks.some((l) => l.source === d)
      );
      path
        .classed("primary", (l) => l.source === d || l.target === d)
        .filter(".primary")
        .raise();
    })
    .on("mouseout", (d) => {
      svg.classed("hover", false);
      label.classed("primary", false);
      label.classed("secondary", false);
      path.classed("primary", false).order();
    });

  function update(order) {
    y.domain(graph.nodes.sort(order).map((d) => d.id));

    const t = svg.transition().duration(750);

    label
      .transition(t)
      .delay((d, i) => i * 20)
      .attrTween("transform", (d) => {
        const i = d3interpolateNumber(d.y, y(d.id));
        return (t) => `translate(${margin.left},${(d.y = i(t))})`;
      });

    path
      .transition(t)
      .duration(750 + graph.nodes.length * 20)
      .attrTween("d", (d) => () => arc(d));

    overlay
      .transition(t)
      .delay((d, i) => i * 20)
      .attr("y", (d) => y(d.id) - step / 2);
  }

  return update;
};

const ArcDiagram = (props) => {
  const [selected, setSelected] = React.useState(0);
  const [update, setUpdate] = React.useState(null);

  const handleChange = (event) => {
    setSelected(event.target.value);
  };

  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/miserables.json");

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    if (svg && params) {
      setUpdate(() => draw(svg, params));
    }
  }, [svg, params]);

  React.useEffect(() => {
    if (update) {
      update(orders[selected]);
    }
  }, [update, selected]);

  return (
    <React.Fragment>
      <form>
        <select value={selected} onChange={handleChange}>
          <option value={0}>Order by name</option>
          <option value={1}>Order by group</option>
          <option value={2}>Order by degree</option>
        </select>
      </form>
      <div ref={container}></div>
    </React.Fragment>
  );
};

export default ArcDiagram;
