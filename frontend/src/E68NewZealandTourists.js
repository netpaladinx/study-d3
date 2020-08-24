import React from "react";

import { max as d3max, extent as d3extent } from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleUtc as d3scaleUtc,
  scaleLog as d3scaleLog,
  scaleLinear as d3scaleLinear,
} from "d3-scale";
import { line as d3line } from "d3-shape";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 500;
const margin = { top: 20, right: 30, bottom: 30, left: 50 };

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const x = d3scaleUtc()
    .domain(d3extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const yLinear = d3scaleLinear()
    .domain([0, d3max(data, (d) => d.value)])
    .nice()
    .rangeRound([height - margin.bottom, margin.top]);

  const yLog = d3scaleLog()
    .domain(d3extent(data, (d) => d.value))
    .rangeRound([height - margin.bottom, margin.top]);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3axisBottom(x)
          .ticks(width / 80)
          .tickSizeOuter(0)
      )
      .call((g) => g.select(".domain").remove());

  const yAxis = (g, y, format) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).ticks(height / 80, format))
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("stroke-opacity", 0.2)
          .attr("x2", width - margin.left - margin.right)
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", -margin.left)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(data.y)
      );

  const yTickPosition = (g, y) =>
    g
      .selectAll(".tick")
      .attr(
        "transform",
        (d) => `translate(0,${(isNaN(y(d)) ? yLinear(d) : y(d)) + 0.5})`
      );

  const line = (y) =>
    d3line()
      .x((d) => x(d.date))
      .y((d) => y(d.value));

  return { xAxis, yAxis, yLinear, yLog, yTickPosition, line };
};

const draw = (svg, data, params) => {
  const { xAxis, yAxis, yLinear, yLog, yTickPosition, line } = params;

  svg.append("g").call(xAxis);

  const axisLinear = svg.append("g").style("opacity", 1).call(yAxis, yLinear);

  const axisLog = svg
    .append("g")
    .style("opacity", 0)
    .call(yAxis, yLog, ",")
    .call(yTickPosition, yLinear);

  const path = svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", line(yLinear));

  function update(yType) {
    const y = yType === "linear" ? yLinear : yLog;
    const t = svg.transition().duration(750);
    axisLinear
      .transition(t)
      .style("opacity", y === yLinear ? 1 : 0)
      .call(yTickPosition, y);
    axisLog
      .transition(t)
      .style("opacity", y === yLog ? 1 : 0)
      .call(yTickPosition, y);
    path.transition(t).attr("d", line(y));
  }

  return update;
};

const NewZealandTourists = (props) => {
  const [yType, setYType] = React.useState("linear");
  const [update, setUpdate] = React.useState(null);

  const handleChange = (event) => {
    setYType(event.target.value);
  };

  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/nz-tourists.csv", (text) =>
    Object.assign(
      d3csvParse(text, d3autoType).map(({ Date, Close }) => ({
        date: Date,
        value: Close,
      })),
      { y: "Visitors per month" }
    )
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    if (svg && data && params) {
      const upd = draw(svg, data, params);
      setUpdate(() => upd);
    }
  }, [svg, data, params]);

  React.useEffect(() => {
    if (update) {
      update(yType);
    }
  }, [update, yType]);

  return (
    <React.Fragment>
      <form>
        <label>
          <input
            type="radio"
            value="linear"
            checked={"linear" === yType}
            onChange={handleChange}
          />
          &nbsp;Linear Scale&nbsp;
        </label>
        <label>
          <input
            type="radio"
            value="log"
            checked={"log" === yType}
            onChange={handleChange}
          />
          &nbsp;Log Scale&nbsp;
        </label>
      </form>
      <div ref={container}></div>
    </React.Fragment>
  );
};

export default NewZealandTourists;
