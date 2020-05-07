import { format } from "d3-format";
import { scaleTime } from "d3-scale";
import { bisectLeft } from "d3-array";
const f1 = () => {
  console.log("1.4 " + format("d")(1.4));
  console.log("1.5 " + format("d")(1.5));
  console.log("1.6 " + format("d")(1.6));
};

const f2 = () => {
  const y = scaleTime()
    .domain([new Date(2011, 0, 1), new Date(2011, 0, 1, 23, 59)])
    .range([0, 525]);
  const v = y(new Date(2011, 0, 1, 12));
  console.log(v + " " + format("d")(v));
};

const f3 = () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  console.log("bisectLeft(arr, 3): " + bisectLeft(arr, 3));
  console.log("bisectLeft(arr, 3.5): " + bisectLeft(arr, 3.5));
  console.log("bisectLeft(arr, 3.5, 1): " + bisectLeft(arr, 3.5, 1));
  console.log("bisectLeft(arr, 3.5, 5): " + bisectLeft(arr, 3.5, 5));
};

export const execute = () => {};
