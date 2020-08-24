import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";

import {
  scaleBand as d3scaleBand,
  scaleLinear as d3scaleLinear,
} from "d3-scale";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import { max as d3max } from "d3-array";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 500;
const margin = { top: 20, right: 0, bottom: 30, left: 40 };

const orders = [
  (a, b) => a.name.localeCompare(b.name),
  (a, b) => a.value - b.value,
  (a, b) => b.value - a.value,
];

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (source) => {
  const data = source.map(({ letter, frequency }) => ({
    name: letter,
    value: +frequency,
  }));

  const x = d3scaleBand()
    .domain(data.map((d) => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const y = d3scaleLinear()
    .domain([0, d3max(data, (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3axisBottom(x).tickSizeOuter(0));

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y))
      .call((g) => g.select(".domain").remove());

  return { data, x, y, xAxis, yAxis };
};

const draw = (svg, params) => {
  const { data, x, y, xAxis, yAxis } = params;

  const bar = svg
    .append("g")
    .attr("fill", "steelblue")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .style("mix-blend-mode", "multiply")
    .attr("x", (d) => x(d.name))
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => y(0) - y(d.value))
    .attr("width", x.bandwidth());

  const gx = svg.append("g").call(xAxis);

  const gy = svg.append("g").call(yAxis);

  const update = (order) => {
    x.domain(data.sort(order).map((d) => d.name));

    const t = svg.transition().duration(750);

    bar
      .data(data, (d) => d.name)
      .order()
      .transition(t)
      .delay((d, i) => i * 20)
      .attr("x", (d) => x(d.name));

    gx.transition(t)
      .call(xAxis)
      .selectAll(".tick")
      .delay((d, i) => i * 20);
  };

  return update;
};

const SortableBarChart = (props) => {
  const [value, setValue] = React.useState(0);
  const [updateDraw, setUpdateDraw] = React.useState(null);

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const [container, svg] = useSvg(init);

  const [source] = useDataFetchMemo("/data/alphabet.csv");

  const params = React.useMemo(() => callIfReady(computeParams, source), [
    source,
  ]);

  React.useEffect(() => {
    if (svg && params) {
      const update = draw(svg, params);
      setUpdateDraw(() => update);
    }
  }, [svg, params]);

  React.useEffect(() => {
    if (updateDraw) {
      updateDraw(orders[value]);
    }
  }, [updateDraw, value]);

  return (
    <React.Fragment>
      <FormControl>
        <Select value={value} onChange={handleChange}>
          <MenuItem value={0}>Alphabetical</MenuItem>
          <MenuItem value={1}>Frequency, ascending</MenuItem>
          <MenuItem value={2}>Frequency, descending</MenuItem>
        </Select>
      </FormControl>
      <div ref={container}></div>
    </React.Fragment>
  );
};

export default SortableBarChart;
