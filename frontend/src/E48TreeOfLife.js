import React from "react";

import { max as d3max, ascending as d3ascending } from "d3-array";
import { transition as d3transition } from "d3-transition";
import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import { select as d3select } from "d3-selection";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { cluster as d3cluster, hierarchy as d3hierarchy } from "d3-hierarchy";

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
});

// https://github.com/jasondavies/newick.js
function parseNewick(a) {
  const s = a.split(/\s*(;|\(|\)|,|:)\s*/);
  const e = [];
  let r = {};
  let c;
  let h;
  for (let t = 0; t < s.length; t++) {
    let n = s[t];
    switch (n) {
      case "(":
        c = {};
        r.branchset = [c];
        e.push(r);
        r = c;
        break;
      case ",":
        c = {};
        e[e.length - 1].branchset.push(c);
        r = c;
        break;
      case ")":
        r = e.pop();
        break;
      case ":":
        break;
      default:
        h = s[t - 1];
        ")" === h || "(" === h || "," === h
          ? (r.name = n)
          : ":" === h && (r.length = parseFloat(n));
    }
  }
  return r;
}

const computeParams = (data) => {
  const outerRadius = width / 2;
  const innerRadius = outerRadius - 170;

  const cluster = d3cluster()
    .size([360, innerRadius])
    .separation((a, b) => 1);

  const color = d3scaleOrdinal()
    .domain(["Bacteria", "Eukaryota", "Archaea"])
    .range(d3schemeCategory10);

  // Compute the maximum cumulative length of any node in the tree.
  const maxLength = (d) =>
    d.data.length + (d.children ? d3max(d.children, maxLength) : 0);

  // Set the radius of each node by recursively summing and scaling the distance from the root.
  function setRadius(d, y0, k) {
    d.radius = (y0 += d.data.length) * k;
    if (d.children) d.children.forEach((d) => setRadius(d, y0, k));
  }

  // Set the color of each node by recursively inheriting.
  const setColor = (d) => {
    const name = d.data.name;
    d.color =
      color.domain().indexOf(name) >= 0
        ? color(name)
        : d.parent
        ? d.parent.color
        : null;
    if (d.children) d.children.forEach(setColor);
  };

  function linkVariable(d) {
    return linkStep(d.source.x, d.source.radius, d.target.x, d.target.radius);
  }

  function linkConstant(d) {
    return linkStep(d.source.x, d.source.y, d.target.x, d.target.y);
  }

  function linkExtensionVariable(d) {
    return linkStep(d.target.x, d.target.radius, d.target.x, innerRadius);
  }

  function linkExtensionConstant(d) {
    return linkStep(d.target.x, d.target.y, d.target.x, innerRadius);
  }

  function linkStep(startAngle, startRadius, endAngle, endRadius) {
    const c0 = Math.cos((startAngle = ((startAngle - 90) / 180) * Math.PI));
    const s0 = Math.sin(startAngle);
    const c1 = Math.cos((endAngle = ((endAngle - 90) / 180) * Math.PI));
    const s1 = Math.sin(endAngle);
    return (
      "M" +
      startRadius * c0 +
      "," +
      startRadius * s0 +
      (endAngle === startAngle
        ? ""
        : "A" +
          startRadius +
          "," +
          startRadius +
          " 0 0 " +
          (endAngle > startAngle ? 1 : 0) +
          " " +
          startRadius * c1 +
          "," +
          startRadius * s1) +
      "L" +
      endRadius * c1 +
      "," +
      endRadius * s1
    );
  }

  const root = d3hierarchy(data, (d) => d.branchset)
    .sum((d) => (d.branchset ? 0 : 1))
    .sort(
      (a, b) => a.value - b.value || d3ascending(a.data.length, b.data.length)
    );

  cluster(root);
  setRadius(root, (root.data.length = 0), innerRadius / maxLength(root));
  setColor(root);

  return {
    outerRadius,
    innerRadius,
    color,
    root,
    linkVariable,
    linkConstant,
    linkExtensionVariable,
    linkExtensionConstant,
    linkStep,
  };
};

const draw = (svg, params) => {
  const {
    outerRadius,
    innerRadius,
    color,
    root,
    linkVariable,
    linkConstant,
    linkExtensionVariable,
    linkExtensionConstant,
    linkStep,
  } = params;

  const legend = (svg) => {
    const g = svg
      .selectAll("g")
      .data(color.domain())
      .join("g")
      .attr(
        "transform",
        (d, i) => `translate(${-outerRadius},${-outerRadius + i * 20})`
      );

    g.append("rect").attr("width", 18).attr("height", 18).attr("fill", color);

    g.append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", "0.35em")
      .text((d) => d);
  };

  svg
    .attr("viewBox", [-outerRadius, -outerRadius, width, width])
    .attr("font-family", "sans-serif")
    .attr("font-size", 10);

  svg.append("g").call(legend);

  svg.append("style").text(`
.link--active {
  stroke: #000 !important;
  stroke-width: 1.5px;
}

.link-extension--active {
  stroke-opacity: .6;
}

.label--active {
  font-weight: bold;
}

`);

  const linkExtension = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-opacity", 0.25)
    .selectAll("path")
    .data(root.links().filter((d) => !d.target.children))
    .join("path")
    .each(function (d) {
      d.target.linkExtensionNode = this;
    })
    .attr("d", linkExtensionConstant);

  const link = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#000")
    .selectAll("path")
    .data(root.links())
    .join("path")
    .each(function (d) {
      d.target.linkNode = this;
    })
    .attr("d", linkConstant)
    .attr("stroke", (d) => d.target.color);

  svg
    .append("g")
    .selectAll("text")
    .data(root.leaves())
    .join("text")
    .attr("dy", ".31em")
    .attr(
      "transform",
      (d) =>
        `rotate(${d.x - 90}) translate(${innerRadius + 4},0)${
          d.x < 180 ? "" : " rotate(180)"
        }`
    )
    .attr("text-anchor", (d) => (d.x < 180 ? "start" : "end"))
    .text((d) => d.data.name.replace(/_/g, " "))
    .on("mouseover", mouseovered(true))
    .on("mouseout", mouseovered(false));

  function update(checked) {
    const t = d3transition().duration(750);
    linkExtension
      .transition(t)
      .attr("d", checked ? linkExtensionVariable : linkExtensionConstant);
    link.transition(t).attr("d", checked ? linkVariable : linkConstant);
  }

  function mouseovered(active) {
    return function (d) {
      d3select(this).classed("label--active", active);
      d3select(d.linkExtensionNode)
        .classed("link-extension--active", active)
        .raise();
      do d3select(d.linkNode).classed("link--active", active).raise();
      while ((d = d.parent));
    };
  }

  return update;
};

const TreeOfLife = (props) => {
  const [checked, setChecked] = React.useState(false);
  const [update, setUpdate] = React.useState(null);

  const handleChange = (event) => {
    setChecked(event.target.checked);
  };

  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/life.txt", (text) =>
    parseNewick(text)
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    if (svg && params) {
      setUpdate(() => draw(svg, params));
    }
  }, [svg, params]);

  React.useEffect(() => {
    if (update) {
      update(checked);
    }
  }, [update, checked]);

  return (
    <React.Fragment>
      <form>
        <label>
          <input type="checkbox" checked={checked} onChange={handleChange} />
          <span>Show branch length</span>
        </label>
      </form>
      <div ref={container}></div>
    </React.Fragment>
  );
};

export default TreeOfLife;
