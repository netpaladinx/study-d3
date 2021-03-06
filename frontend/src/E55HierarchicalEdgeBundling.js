import React from "react";

import { ascending as d3ascending } from "d3-array";
import { select as d3select, selectAll as d3selectAll } from "d3-selection";
import { cluster as d3cluster, hierarchy as d3hierarchy } from "d3-hierarchy";
import {
  lineRadial as d3lineRadial,
  curveBundle as d3curveBundle,
} from "d3-shape";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;

const init = makeSvgInit({
  width,
  height: null,
  attrs: {
    viewBox: [-width / 2, -width / 2, width, width],
  },
});

const computeParams = (source) => {
  const colorin = "#00f";
  const colorout = "#f00";
  const colornone = "#ccc";
  const radius = width / 2;

  const line = d3lineRadial()
    .curve(d3curveBundle.beta(0.85))
    .radius((d) => d.y)
    .angle((d) => d.x);

  const tree = d3cluster().size([2 * Math.PI, radius - 100]);

  function id(node) {
    return `${node.parent ? id(node.parent) + "." : ""}${node.data.name}`;
  }

  function bilink(root) {
    const map = new Map(root.leaves().map((d) => [id(d), d]));
    for (const d of root.leaves()) {
      d.incoming = [];
      d.outgoing = d.data.imports.map((i) => [d, map.get(i)]);
    }
    for (const d of root.leaves())
      for (const o of d.outgoing) o[1].incoming.push(o);
    return root;
  }

  function hierarchy(data, delimiter = ".") {
    let root;
    const map = new Map();
    data.forEach(function find(data) {
      const { name } = data;
      if (map.has(name)) return map.get(name);
      const i = name.lastIndexOf(delimiter);
      map.set(name, data);
      if (i >= 0) {
        find({ name: name.substring(0, i), children: [] }).children.push(data);
        data.name = name.substring(i + 1);
      } else {
        root = data;
      }
      return data;
    });
    return root;
  }

  const data = hierarchy(source);

  const root = tree(
    bilink(
      d3hierarchy(data).sort(
        (a, b) =>
          d3ascending(a.height, b.height) ||
          d3ascending(a.data.name, b.data.name)
      )
    )
  );

  return { colorin, colorout, colornone, line, root, id };
};

const draw = (svg, params) => {
  const { colorin, colorout, colornone, line, root, id } = params;

  const node = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr(
      "transform",
      (d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`
    )
    .append("text")
    .attr("dy", "0.31em")
    .attr("x", (d) => (d.x < Math.PI ? 6 : -6))
    .attr("text-anchor", (d) => (d.x < Math.PI ? "start" : "end"))
    .attr("transform", (d) => (d.x >= Math.PI ? "rotate(180)" : null))
    .text((d) => d.data.name)
    .each(function (d) {
      d.text = this;
    })
    .on("mouseover", overed)
    .on("mouseout", outed)
    .call((text) =>
      text.append("title").text(
        (d) => `${id(d)}
${d.outgoing.length} outgoing
${d.incoming.length} incoming`
      )
    );

  const link = svg
    .append("g")
    .attr("stroke", colornone)
    .attr("fill", "none")
    .selectAll("path")
    .data(root.leaves().flatMap((leaf) => leaf.outgoing))
    .join("path")
    .style("mix-blend-mode", "multiply")
    .attr("d", ([i, o]) => line(i.path(o)))
    .each(function (d) {
      d.path = this;
    });

  function overed(d) {
    link.style("mix-blend-mode", null);
    d3select(this).attr("font-weight", "bold");
    d3selectAll(d.incoming.map((d) => d.path))
      .attr("stroke", colorin)
      .raise();
    d3selectAll(d.incoming.map(([d]) => d.text))
      .attr("fill", colorin)
      .attr("font-weight", "bold");
    d3selectAll(d.outgoing.map((d) => d.path))
      .attr("stroke", colorout)
      .raise();
    d3selectAll(d.outgoing.map(([, d]) => d.text))
      .attr("fill", colorout)
      .attr("font-weight", "bold");
  }

  function outed(d) {
    link.style("mix-blend-mode", "multiply");
    d3select(this).attr("font-weight", null);
    d3selectAll(d.incoming.map((d) => d.path)).attr("stroke", null);
    d3selectAll(d.incoming.map(([d]) => d.text))
      .attr("fill", null)
      .attr("font-weight", null);
    d3selectAll(d.outgoing.map((d) => d.path)).attr("stroke", null);
    d3selectAll(d.outgoing.map(([, d]) => d.text))
      .attr("fill", null)
      .attr("font-weight", null);
  }
};

const HierarchicalEdgeBundling = (props) => {
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

export default HierarchicalEdgeBundling;
