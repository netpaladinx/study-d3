import React from "react";

import { ascending as d3ascending, transpose as d3transpose } from "d3-array";
import { interpolateRdBu as d3interpolateRdBu } from "d3-scale-chromatic";
import { hierarchy as d3hierarchy, cluster as d3cluster } from "d3-hierarchy";
import { easeQuad as d3easeQuad } from "d3-ease";
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
});

class Line {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
  split() {
    const { a, b } = this;
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return [new Line(a, m), new Line(m, b)];
  }
  toString() {
    return `M${this.a}L${this.b}`;
  }
}

const l1 = [4 / 8, 4 / 8, 0 / 8, 0 / 8];
const l2 = [2 / 8, 4 / 8, 2 / 8, 0 / 8];
const l3 = [1 / 8, 3 / 8, 3 / 8, 1 / 8];
const r1 = [0 / 8, 2 / 8, 4 / 8, 2 / 8];
const r2 = [0 / 8, 0 / 8, 4 / 8, 4 / 8];

function dot([ka, kb, kc, kd], { a, b, c, d }) {
  return [
    ka * a[0] + kb * b[0] + kc * c[0] + kd * d[0],
    ka * a[1] + kb * b[1] + kc * c[1] + kd * d[1],
  ];
}

class BezierCurve {
  constructor(a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }
  split() {
    const m = dot(l3, this);
    return [
      new BezierCurve(this.a, dot(l1, this), dot(l2, this), m),
      new BezierCurve(m, dot(r1, this), dot(r2, this), this.d),
    ];
  }
  toString() {
    return `M${this.a}C${this.b},${this.c},${this.d}`;
  }
}

class Path {
  constructor(_) {
    this._ = _;
    this._m = undefined;
  }
  moveTo(x, y) {
    this._ = [];
    this._m = [x, y];
  }
  lineTo(x, y) {
    this._.push(new Line(this._m, (this._m = [x, y])));
  }
  bezierCurveTo(ax, ay, bx, by, x, y) {
    this._.push(
      new BezierCurve(this._m, [ax, ay], [bx, by], (this._m = [x, y]))
    );
  }
  *split(k = 0) {
    const n = this._.length;
    const i = Math.floor(n / 2);
    const j = Math.ceil(n / 2);
    const a = new Path(this._.slice(0, i));
    const b = new Path(this._.slice(j));
    if (i !== j) {
      const [ab, ba] = this._[i].split();
      a._.push(ab);
      b._.unshift(ba);
    }
    if (k > 1) {
      yield* a.split(k - 1);
      yield* b.split(k - 1);
    } else {
      yield a;
      yield b;
    }
  }
  toString() {
    return this._.join("");
  }
}

const computeParams = (source) => {
  const radius = width / 2;
  const k = 6;

  const color = (t) => d3interpolateRdBu(1 - t);

  const tree = d3cluster().size([2 * Math.PI, radius - 100]);

  const line = d3lineRadial()
    .curve(d3curveBundle)
    .radius((d) => d.y)
    .angle((d) => d.x);

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

  function id(node) {
    return `${node.parent ? id(node.parent) + "." : ""}${node.data.name}`;
  }

  function path([source, target]) {
    const p = new Path();
    line.context(p)(source.path(target));
    return p;
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

  return { k, root, path, id, color };
};

const draw = (svg, params) => {
  const { k, root, path, id, color } = params;

  svg.attr("viewBox", [-width / 2, -width / 2, width, width]);

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
    .call((text) =>
      text.append("title").text(
        (d) => `${id(d)}
${d.outgoing.length} outgoing
${d.incoming.length} incoming`
      )
    );

  svg
    .append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(
      d3transpose(
        root
          .leaves()
          .flatMap((leaf) => leaf.outgoing.map(path))
          .map((path) => Array.from(path.split(k)))
      )
    )
    .join("path")
    .style("mix-blend-mode", "darken")
    .attr("stroke", (d, i) => color(d3easeQuad(i / ((1 << k) - 1))))
    .attr("d", (d) => d.join(""));
};

const HierarchicalEdgeBundling2 = (props) => {
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

export default HierarchicalEdgeBundling2;
