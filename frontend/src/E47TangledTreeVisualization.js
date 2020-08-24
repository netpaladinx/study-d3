import React from "react";

import { max as d3max, min as d3min } from "d3-array";
import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import { schemeDark2 as d3schemeDark2 } from "d3-scale-chromatic";

import { useSvg, makeSvgInit, callIfReady } from "./lib/d3-lib";

const width = 954;

const init = makeSvgInit({
  width,
  height: null,
});

const computeParams = () => {
  const levels = [
    [{ id: "Chaos" }],
    [{ id: "Gaea", parents: ["Chaos"] }, { id: "Uranus" }],
    [
      { id: "Oceanus", parents: ["Gaea", "Uranus"] },
      { id: "Thethys", parents: ["Gaea", "Uranus"] },
      { id: "Pontus" },
      { id: "Rhea", parents: ["Gaea", "Uranus"] },
      { id: "Cronus", parents: ["Gaea", "Uranus"] },
      { id: "Coeus", parents: ["Gaea", "Uranus"] },
      { id: "Phoebe", parents: ["Gaea", "Uranus"] },
      { id: "Crius", parents: ["Gaea", "Uranus"] },
      { id: "Hyperion", parents: ["Gaea", "Uranus"] },
      { id: "Iapetus", parents: ["Gaea", "Uranus"] },
      { id: "Thea", parents: ["Gaea", "Uranus"] },
      { id: "Themis", parents: ["Gaea", "Uranus"] },
      { id: "Mnemosyne", parents: ["Gaea", "Uranus"] },
    ],
    [
      { id: "Doris", parents: ["Oceanus", "Thethys"] },
      { id: "Neures", parents: ["Pontus", "Gaea"] },
      { id: "Dionne" },
      { id: "Demeter", parents: ["Rhea", "Cronus"] },
      { id: "Hades", parents: ["Rhea", "Cronus"] },
      { id: "Hera", parents: ["Rhea", "Cronus"] },
      { id: "Alcmene" },
      { id: "Zeus", parents: ["Rhea", "Cronus"] },
      { id: "Eris" },
      { id: "Leto", parents: ["Coeus", "Phoebe"] },
      { id: "Amphitrite" },
      { id: "Medusa" },
      { id: "Poseidon", parents: ["Rhea", "Cronus"] },
      { id: "Hestia", parents: ["Rhea", "Cronus"] },
    ],
    [
      { id: "Thetis", parents: ["Doris", "Neures"] },
      { id: "Peleus" },
      { id: "Anchises" },
      { id: "Adonis" },
      { id: "Aphrodite", parents: ["Zeus", "Dionne"] },
      { id: "Persephone", parents: ["Zeus", "Demeter"] },
      { id: "Ares", parents: ["Zeus", "Hera"] },
      { id: "Hephaestus", parents: ["Zeus", "Hera"] },
      { id: "Hebe", parents: ["Zeus", "Hera"] },
      { id: "Hercules", parents: ["Zeus", "Alcmene"] },
      { id: "Megara" },
      { id: "Deianira" },
      { id: "Eileithya", parents: ["Zeus", "Hera"] },
      { id: "Ate", parents: ["Zeus", "Eris"] },
      { id: "Leda" },
      { id: "Athena", parents: ["Zeus"] },
      { id: "Apollo", parents: ["Zeus", "Leto"] },
      { id: "Artemis", parents: ["Zeus", "Leto"] },
      { id: "Triton", parents: ["Poseidon", "Amphitrite"] },
      { id: "Pegasus", parents: ["Poseidon", "Medusa"] },
      { id: "Orion", parents: ["Poseidon"] },
      { id: "Polyphemus", parents: ["Poseidon"] },
    ],
    [
      { id: "Deidamia" },
      { id: "Achilles", parents: ["Peleus", "Thetis"] },
      { id: "Creusa" },
      { id: "Aeneas", parents: ["Anchises", "Aphrodite"] },
      { id: "Lavinia" },
      { id: "Eros", parents: ["Hephaestus", "Aphrodite"] },
      { id: "Helen", parents: ["Leda", "Zeus"] },
      { id: "Menelaus" },
      { id: "Polydueces", parents: ["Leda", "Zeus"] },
    ],
    [
      { id: "Andromache" },
      { id: "Neoptolemus", parents: ["Deidamia", "Achilles"] },
      { id: "Aeneas(2)", parents: ["Creusa", "Aeneas"] },
      { id: "Pompilius", parents: ["Creusa", "Aeneas"] },
      { id: "Iulus", parents: ["Lavinia", "Aeneas"] },
      { id: "Hermione", parents: ["Helen", "Menelaus"] },
    ],
  ];

  // precompute level depth
  levels.forEach((l, i) => l.forEach((n) => (n.level = i)));

  const nodes = levels.reduce((a, x) => a.concat(x), []);
  const nodes_index = {};
  nodes.forEach((d) => (nodes_index[d.id] = d));

  // objectification
  nodes.forEach((d) => {
    d.parents = (d.parents === undefined ? [] : d.parents).map(
      (p) => nodes_index[p]
    );
  });

  // precompute bundles
  levels.forEach((l, i) => {
    const index = {};
    l.forEach((n) => {
      if (n.parents.length === 0) {
        return;
      }

      const id = n.parents
        .map((d) => d.id)
        .sort()
        .join("--");
      if (id in index) {
        index[id].parents = index[id].parents.concat(n.parents);
      } else {
        index[id] = { id: id, parents: n.parents.slice(), level: i };
      }
      n.bundle = index[id];
    });
    l.bundles = Object.keys(index).map((k) => index[k]);
    l.bundles.forEach((b, i) => (b.i = i));
  });

  const links = [];
  nodes.forEach((d) => {
    d.parents.forEach((p) =>
      links.push({ source: d, bundle: d.bundle, target: p })
    );
  });

  const bundles = levels.reduce((a, x) => a.concat(x.bundles), []);

  // reverse pointer from parent to bundles
  bundles.forEach((b) =>
    b.parents.forEach((p) => {
      if (p.bundles_index === undefined) {
        p.bundles_index = {};
      }
      if (!(b.id in p.bundles_index)) {
        p.bundles_index[b.id] = [];
      }
      p.bundles_index[b.id].push(b);
    })
  );

  nodes.forEach((n) => {
    if (n.bundles_index !== undefined) {
      n.bundles = Object.keys(n.bundles_index).map((k) => n.bundles_index[k]);
    } else {
      n.bundles_index = {};
      n.bundles = [];
    }
    n.bundles.forEach((b, i) => (b.i = i));
  });

  links.forEach((l) => {
    if (l.bundle.links === undefined) {
      l.bundle.links = [];
    }
    l.bundle.links.push(l);
  });

  // layout
  const padding = 8;
  const node_height = 22;
  const node_width = 70;
  const bundle_width = 14;
  const level_y_padding = 16;
  const metro_d = 4;
  const c = 16;
  const min_family_height = 16;

  nodes.forEach(
    (n) => (n.height = (Math.max(1, n.bundles.length) - 1) * metro_d)
  );

  let x_offset = padding;
  let y_offset = padding;
  levels.forEach((l) => {
    x_offset += l.bundles.length * bundle_width;
    y_offset += level_y_padding;
    l.forEach((n, i) => {
      n.x = n.level * node_width + x_offset;
      n.y = node_height + y_offset + n.height / 2;

      y_offset += node_height + n.height;
    });
  });

  let i = 0;
  levels.forEach((l) => {
    l.bundles.forEach((b) => {
      b.x =
        b.parents[0].x +
        node_width +
        (l.bundles.length - 1 - b.i) * bundle_width;
      b.y = i * node_height;
    });
    i += l.length;
  });

  links.forEach((l) => {
    l.xt = l.target.x;
    l.yt =
      l.target.y +
      l.target.bundles_index[l.bundle.id].i * metro_d -
      (l.target.bundles.length * metro_d) / 2 +
      metro_d / 2;
    l.xb = l.bundle.x;
    l.xs = l.source.x;
    l.ys = l.source.y;
  });

  // compress vertical space
  let y_negative_offset = 0;
  levels.forEach((l) => {
    y_negative_offset +=
      -min_family_height +
        d3min(l.bundles, (b) =>
          d3min(b.links, (link) => link.ys - c - (link.yt + c))
        ) || 0;
    l.forEach((n) => (n.y -= y_negative_offset));
  });

  // very ugly, I know
  links.forEach((l) => {
    l.yt =
      l.target.y +
      l.target.bundles_index[l.bundle.id].i * metro_d -
      (l.target.bundles.length * metro_d) / 2 +
      metro_d / 2;
    l.ys = l.source.y;
    l.c1 = l.source.level - l.target.level > 1 ? node_width + c : c;
    l.c2 = c;
  });

  const layout = {
    height: d3max(nodes, (n) => n.y) + node_height / 2 + 2 * padding,
    node_height,
    node_width,
    bundle_width,
    level_y_padding,
    metro_d,
  };

  return { levels, nodes, nodes_index, links, bundles, layout };
};

const draw = (svg, params) => {
  const { levels, nodes, nodes_index, links, bundles, layout } = params;
  const color = d3scaleOrdinal(d3schemeDark2);

  const pathData = bundles.map((b) => ({
    d: b.links
      .map(
        (l) => `
M${l.xt} ${l.yt}
L${l.xb - l.c1} ${l.yt}
A${l.c1} ${l.c1} 90 0 1 ${l.xb} ${l.yt + l.c1}
L${l.xb} ${l.ys - l.c2}
A${l.c2} ${l.c2} 90 0 0 ${l.xb + l.c2} ${l.ys}
L${l.xs} ${l.ys}`
      )
      .join(""),
    id: b.id,
  }));

  svg
    .attr("height", layout.height)
    .attr("font-family", "sans-serif")
    .attr("font-size", "10px");

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 5)
    .selectAll("path")
    .data(pathData)
    .join("path")
    .attr("d", (d) => d.d);

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .selectAll("path")
    .data(pathData)
    .join("path")
    .attr("stroke", (d) => `${color(d.id)}`)
    .attr("d", (d) => d.d);

  svg
    .append("g")
    .attr("stroke-linecap", "round")
    .attr("stroke", "black")
    .attr("stroke-width", 8)
    .selectAll("line")
    .data(nodes)
    .join("line")
    .attr("x1", (d) => d.x)
    .attr("y1", (d) => d.y - d.height / 2)
    .attr("x2", (d) => d.x)
    .attr("y2", (d) => d.y + d.height / 2);

  svg
    .append("g")
    .attr("stroke-linecap", "round")
    .attr("stroke", "white")
    .attr("stroke-width", 4)
    .selectAll("line")
    .data(nodes)
    .join("line")
    .attr("x1", (d) => d.x)
    .attr("y1", (d) => d.y - d.height / 2)
    .attr("x2", (d) => d.x)
    .attr("y2", (d) => d.y + d.height / 2);

  svg
    .append("g")
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", (d) => d.x + 4)
    .attr("y", (d) => d.y - d.height / 2 - 4)
    .text((d) => d.id);

  svg
    .append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", (d) => d.x + 4)
    .attr("y", (d) => d.y - d.height / 2 - 4)
    .text((d) => d.id);
};

const TangledTreeVisualization = (props) => {
  const [container, svg] = useSvg(init);

  const params = React.useMemo(() => computeParams(), []);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default TangledTreeVisualization;
