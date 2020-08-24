import React from "react";

import { extent as d3extent, ticks as d3ticks } from "d3-array";
import { scaleTime as d3scaleTime, scaleLog as d3scaleLog } from "d3-scale";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";
import { line as d3line } from "d3-shape";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 600;
const margin = { top: 10, right: 20, bottom: 30, left: 40 };

const init = makeSvgInit({
  width,
  height,
  styles: {
    overflow: "visible",
  },
});

const computeParams = (data) => {
  const values = Float64Array.from(data, (d) => d.value);

  const x = d3scaleTime()
    .domain(d3extent(data, (d) => d.date))
    .rangeRound([margin.left, width - margin.right]);

  const y = d3scaleLog()
    .domain(d3extent(values))
    .rangeRound([height - margin.bottom - 20, margin.top]);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3axisBottom(x).ticks(width / 80))
      .call((g) => g.select(".domain").remove());

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3axisLeft(y)
          .tickValues(d3ticks(...y.domain(), 10))
          .tickFormat((d) => d)
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", width - margin.left - margin.right)
          .attr("stroke-opacity", 0.1)
      )
      .call((g) =>
        g
          .select(".tick:last-of-type text")
          .clone()
          .attr("x", 3)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(data.y)
      );

  const line = d3line()
    .defined((d) => !isNaN(d))
    .x((d, i) => x(data[i].date))
    .y(y);

  return { x, y, xAxis, yAxis, line, values };
};

const draw = (svg, params) => {
  const { xAxis, yAxis, line, values } = params;

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  const g = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");

  function bollinger(values, N, K) {
    let i = 0;
    let sum = 0;
    let sum2 = 0;
    const bands = K.map(() => new Float64Array(values.length).fill(NaN));
    for (let n = Math.min(N - 1, values.length); i < n; ++i) {
      const value = values[i];
      sum += value;
      sum2 += value ** 2;
    }
    for (let n = values.length, m = bands.length; i < n; ++i) {
      const value = values[i];
      sum += value;
      sum2 += value ** 2;
      const mean = sum / N;
      const deviation = Math.sqrt((sum2 - sum ** 2 / N) / (N - 1));
      for (let j = 0; j < K.length; ++j) {
        bands[j][i] = mean + deviation * K[j];
      }
      const value0 = values[i - N + 1];
      sum -= value0;
      sum2 -= value0 ** 2;
    }
    return bands;
  }

  function update(N, K) {
    g.selectAll("path")
      .data([values, ...bollinger(values, N, [-K, 0, +K])])
      .join("path")
      .attr("stroke", (d, i) => ["#aaa", "green", "blue", "red"][i])
      .attr("d", line);
  }

  return update;
};

const BollingerBands = (props) => {
  const [periodsValue, setPeriodsValue] = React.useState(20);
  const [stdValue, setStdValue] = React.useState(2);

  const handleChangePeriod = (event) => {
    setPeriodsValue(event.target.value);
  };

  const handleChangeStd = (event) => {
    setStdValue(event.target.value);
  };

  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/aapl.csv", (text) =>
    Object.assign(
      d3csvParse(text, d3autoType).map(({ date, close }) => ({
        date,
        value: close,
      })),
      { y: "$ Close" }
    )
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  const [update, setUpdate] = React.useState(null);

  React.useEffect(() => {
    if (svg && params) {
      const newUpdate = draw(svg, params);
      setUpdate(() => newUpdate);
    }
  }, [svg, params]);

  React.useEffect(() => {
    if (update) {
      update(periodsValue, stdValue);
    }
  }, [update, periodsValue, stdValue]);

  return (
    <React.Fragment>
      <form>
        <input
          type="number"
          min="1"
          max="100"
          value={periodsValue}
          step="1"
          style={{ width: 40 }}
          onChange={handleChangePeriod}
        />
        <span style={{ fontSize: "smaller", fontStyle: "oblique" }}>
          &nbsp;periods (N)
        </span>
      </form>
      <form>
        <input
          type="number"
          min="0"
          max="10"
          value={stdValue}
          step="0.1"
          style={{ width: 40 }}
          onChange={handleChangeStd}
        />
        <span style={{ fontSize: "smaller", fontStyle: "oblique" }}>
          &nbsp;standard deviations (K)
        </span>
      </form>
      <div ref={container}></div>
    </React.Fragment>
  );
};

export default BollingerBands;
