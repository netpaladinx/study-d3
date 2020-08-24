## Pipeline

1. Setup SVG or CANVAS
2. Fetch or generate data
3. Computate params
4. Draw

## JavaScript Basics

1. Object

- Object.assign():
- Object.create(): create a new object using an existing object as the prototype

2. Array

- Array class is a global object to construct arrays, and an array object has object properities and a list of array elements separately

- Array.XXX()

  - Array.from(): create a shallow-copied Array instance from an array-like or iterable object
    ```
    Array.from('Hey');                   // => ['H', 'e', 'y']
    Array.from(new Set(['one', 'two'])); // => ['one', 'two']
    const map = new Map();
    map.set('one', 1)
    map.set('two', 2);
    Array.from(map); // => [['one', 1], ['two', 2]]
    ```
  - Array.isArray()
  - Array.of()

- Array.prototype.XXX()
  - .map()
  - .faltMap()

## D3

### D3 Basics

### d3-select

- Selection structure

  - A subclass of array, providing methods: `.map`, `.each`, `.filter`, `.sort`
  - Array of arrays of elements (or array of groups, each group being an array of elements)
    - `d3.select()`: array of one group of one element
      - Inspect the contained node: `selection[0][0]` or `selection.node`
      - `parentNode` is the document element
    - `d3.selectAll()`: array of one group of any number of elements
      - `parentNode` is the document element
    - `selection.selectAll()`: array of multiple groups
      - `d3.selectAll("tr").selectAll("td")`: `parentNode` is tr
      - `d3.selectAll("tr").selectAll("td").selectAll("span")`: `parentNode` is td
  - `.attr()`, `.style()`: called for each element
  - Differences between select and selectAll
    - `select`: preserve the previous grouping and propagate data from parent to child (because of one-to-one)
    - `selectAll`: regroup but not propagate data from parent to child (because of one-to-many)
    - `append`, `insert` (wrappers of `select`): preserve grouping and propagate data
      - `d3.selectAll("section")` => `d3.selectAll("section").append("p")`: group stays unchanged, elements change from "section"s to "p"s (or null if missing), data propagate from "section"s to "p"s
  - `update`, `enter`, `exit` selection
    - Update and exit are normal selections
    - Enter is a subclass of selection (contains placeholders (object with `.__data__`) rather than DOM elements)

- Data structure
  - Grouped data: Array of arrays of data values
  - Bound to elements but not selection: data is not a property of selection, but a property of elements (`.__data__`)
  - Binding ways:
    - `selection.data((parentNode, groupIndex) => arrayOfDataForGroup, keyFunc)`
      - Defines data per-group rather than per-element (data expressed as an array of values for the group)
    - `selection.datum`
    - Inherited from a parent via `append`, `insert`, or `select`
      - `d3.select("body").datum(42)` => `d3.select("body").datum(42).append("h1")`: group preserved, datum 42 propagated from "body" to "h1"
  - Represented by groups, bound to elements (bound by index (default) or the key function), called by selection

```
// group: selection --> one group --> multiple .g_name elems
// enter: selection --> one group --> multiple g elems (group preserved, one .gname --> one g --> on circle/text )

// 1. Define group and join data. Return a group of ".g_name" elements
const group = svg.selectAll(".g_name").data(...)

// 2. Exit:
group.exit().remove()

// 3. Enter:
// (1) Create a "g" element for each ".g_name" placeholder.
// Return a group of "g" elements ("g" is ".g_name")
const enter = group.enter().append("g").attr("class", "g_name)

// (2) Create a "circle" and a "text" in each "g".
enter.append("circle").attr("class", ...)
enter.append("text").attr("class", ...)

// 4. Merge:
group.merge(enter)
```

- Use `.join`
  ```
  svg.selectAll("circle")
  .data(data)
  .join("circle")
    .attr("fill", "none")
    .attr("stroke", "black");
  ```
  equivalent to
  ```
  svg.selectAll("circle")
  .data(data)
  .join(
    enter => enter.append("circle"),
    update => update,
    exit => exit.remove()
  )
    .attr("fill", "none")
    .attr("stroke", "black");
  ```

#### d3-scale

scaleOrdinal(<array_of_strings>, schemeCategory10)

### D3 Interaction

#### d3-drag, d3-event

## SVG

### Math

- Compute radius: `Math.hypot(endX - startX, endY - startY)`

### Path

- Arcs: `A rx ry x-axis-rotation large-arc-flag sweep-flat x y`
  - `x-axis-rotation`: positive if clockwise
  - `large-arc-flag`: 1 if the larger one picked
  - `sweep-flat`: 1 if clockwise from start to end
  - Case 1: 60 degree clockwise small-arc in a circle (no use for x-axis-rotation)
    ```
    M startX,startY A disFromStartToEnd,disFromStartToEnd 0 0,1 endX,endY
    ```

### transform

- `rotate()`
- `translate()`
- `skewX()`, `skewY()`
- `scale()`

### `defs`

1. Define marker (e.g. arrow head)

```
<defs>
    <marker
        id={for_reference},
        markerWidth={}, // viewbox size
        markerHeight={}, // viewbox size
        refX={X_position_of_refrence_point_or_anchor_point}
        refY={Y_position_of_refrence_point_or_anchor_point}
        markerUnits="strokeWidth"
        orient="auto"
    >
        ...
    </marker>

    // circle marker
    <marker
        id="markerCircle"
        markerWidth="8" markerHeight="8"
        refX="5" refY="5"
    >
        <circle cx="5" cy="5" r="3" style="stroke: none; fill:#000000;"/>
    </marker>

    // arrow marker
    <marker
        id="markerArrow"
        markerWidth="13" markerHeight="13"
        refX="2" refY="6"
        orient="auto"
    >
        <path
            d="M2,2 L2,11 L10,6 L2,2" // or "M2,2 L2,13 L8,7 L2,2"
            style="fill: #000000;" />
    </marker>

    <marker id="markerSquare" markerWidth="7" markerHeight="7" refX="4" refY="4"
          orient="auto">
        <rect x="1" y="1" width="5" height="5" style="stroke: none; fill:#000000;"/>
    /marker>
</defs>

<path d="..."
      style="...;
             marker-start: url(#markerSquare);
             marker-mid: url(#markerCircle);
             marker-end: url(#markerArrow" />
```
