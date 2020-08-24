import React from "react";

import { interpolateZoom as d3interpolateZoom } from "d3-interpolate";
import { interpolateRainbow as d3interpolateRainbow } from "d3-scale-chromatic";

import { useSvg, makeSvgInit } from "./lib/d3-lib";

const width = 600;
const height = 600;

const radius = 6;
const step = radius * 2;
const theta = Math.PI * (3 - Math.sqrt(5));

const init = makeSvgInit({
  width,
  height,
});

const generateData = () => {
  return Array.from({ length: 2000 }, (_, i) => {
    const r = step * Math.sqrt((i += 0.5)),
      a = theta * i;
    return [width / 2 + r * Math.cos(a), height / 2 + r * Math.sin(a)];
  });
};

const draw = (svg, data) => {
  let currentTransform = [width / 2, height / 2, height];

  const g = svg.append("g");

  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", ([x]) => x)
    .attr("cy", ([, y]) => y)
    .attr("r", radius)
    .attr("fill", (d, i) => d3interpolateRainbow(i / 360));

  function transform([x, y, r]) {
    return `
        translate(${width / 2}, ${height / 2})
        scale(${height / r})
        translate(${-x}, ${-y})
      `;
  }

  function transition() {
    const d = data[Math.floor(Math.random() * data.length)];
    const i = d3interpolateZoom(currentTransform, [...d, radius * 2 + 1]);

    g.transition()
      .delay(250)
      .duration(i.duration)
      .attrTween("transform", () => (t) => transform((currentTransform = i(t))))
      .on("end", transition);
  }

  svg.call(transition);
};

const SmoothZooming = (props) => {
  const [container, svg] = useSvg(init);

  const data = React.useMemo(() => {
    return generateData();
  }, []);

  React.useEffect(() => {
    if (svg && data) {
      draw(svg, data);
      console.log("useEffect");
    }
  }, [svg, data]);

  return <div ref={container}></div>;
};

export default SmoothZooming;
