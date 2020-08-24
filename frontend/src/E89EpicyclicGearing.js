import React from "react";

import { useSvg, makeSvgInit, sleep } from "./lib/d3-lib";

const init = makeSvgInit({
  width: null,
  height: null,
});

const draw = async (svg, frameRadius) => {
  svg.clear();

  const x = Math.sin((2 * Math.PI) / 3);
  const y = Math.cos((2 * Math.PI) / 3);

  const gears = [
    { fill: "#c6dbef", teeth: 80, radius: -0.5, origin: [0, 0], annulus: true },
    { fill: "#6baed6", teeth: 16, radius: +0.1, origin: [0, 0] },
    { fill: "#9ecae1", teeth: 32, radius: -0.2, origin: [0, -0.3] },
    { fill: "#9ecae1", teeth: 32, radius: -0.2, origin: [-0.3 * x, -0.3 * y] },
    { fill: "#9ecae1", teeth: 32, radius: -0.2, origin: [0.3 * x, -0.3 * y] },
  ];

  const toothRadius = 0.008;
  const holeRadius = 0.02;
  const speed = 0.08;

  function gear({ teeth, radius, annulus }) {
    const n = teeth;
    let r2 = Math.abs(radius);
    let r0 = r2 - toothRadius;
    let r1 = r2 + toothRadius;
    let r3 = holeRadius;
    if (annulus) {
      r3 = r0;
      r0 = r1;
      r1 = r3;
      r3 = r2 + toothRadius * 3;
    }
    const da = Math.PI / n;
    let a0 = -Math.PI / 2 + (annulus ? Math.PI / n : 0);
    const path = ["M", r0 * Math.cos(a0), ",", r0 * Math.sin(a0)];
    let i = -1;
    while (++i < n) {
      path.push(
        "A",
        r0,
        ",",
        r0,
        " 0 0,1 ",
        r0 * Math.cos((a0 += da)),
        ",",
        r0 * Math.sin(a0),
        "L",
        r2 * Math.cos(a0),
        ",",
        r2 * Math.sin(a0),
        "L",
        r1 * Math.cos((a0 += da / 3)),
        ",",
        r1 * Math.sin(a0),
        "A",
        r1,
        ",",
        r1,
        " 0 0,1 ",
        r1 * Math.cos((a0 += da / 3)),
        ",",
        r1 * Math.sin(a0),
        "L",
        r2 * Math.cos((a0 += da / 3)),
        ",",
        r2 * Math.sin(a0),
        "L",
        r0 * Math.cos(a0),
        ",",
        r0 * Math.sin(a0)
      );
    }
    path.push(
      "M0,",
      -r3,
      "A",
      r3,
      ",",
      r3,
      " 0 0,0 0,",
      r3,
      "A",
      r3,
      ",",
      r3,
      " 0 0,0 0,",
      -r3,
      "Z"
    );
    return path.join("");
  }

  svg
    .attr("viewBox", [-0.53, -0.53, 1.06, 1.06])
    .attr("stroke", "black")
    .attr("stroke-width", 1 / 640)
    .style("max-width", "640px")
    .style("display", "block")
    .style("margin", "auto");

  const frame = svg.append("g");

  const path = frame
    .selectAll("path")
    .data(gears)
    .join("path")
    .attr("fill", (d) => d.fill)
    .attr("d", gear);

  function update(angle, frameAngle) {
    path.attr(
      "transform",
      (d) => `translate(${d.origin}) rotate(${(angle / d.radius) % 360})`
    );
    frame.attr("transform", `rotate(${frameAngle % 360})`);
  }

  let angle = 0;
  let frameAngle = 0;

  while (true) {
    await sleep(10);
    angle += speed;
    frameAngle += speed / frameRadius;
    update(angle, frameAngle);
  }
};

const EpicyclicGearing = (props) => {
  const [frameRadius, setFrameRadius] = React.useState("0.5");

  const handleChange = (event) => {
    setFrameRadius(event.target.value);
  };

  const [container, svg] = useSvg(init);

  React.useEffect(() => {
    if (svg) {
      draw(svg, frameRadius);
    }
  }, [svg, frameRadius]);

  return (
    <React.Fragment>
      <form>
        <select value={frameRadius} onChange={handleChange}>
          <option value="0.5">Annulus</option>
          <option value="Infinity">Planets</option>
          <option value="-0.1">Sun</option>
        </select>
      </form>
      <div ref={container}></div>
    </React.Fragment>
  );
};

export default EpicyclicGearing;
