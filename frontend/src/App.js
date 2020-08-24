import React from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import CssBaseline from "@material-ui/core/CssBaseline";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { execute } from "./console";

import BarChart from "./E01BarChart";
import LineChart from "./E02LineChart";
import MultiLineChart from "./E03MultiLineChart";
import AnimatedColorfulBarChart from "./E04AnimatedColorfulBarChart";
import SunriseAndSunset from "./E05SunriseAndSunset";
import ThreeNodes from "./E06ThreeNodes";
import AnimatedTreemap from "./E07AnimatedTreemap";
import ConnectedScatterplot from "./E08ConnectedScatterplot";
import Gapminder from "./E09Gapminder";
import ScatterplotTour from "./E10ScatterplotTour";
import BarChartRace from "./E11BarChartRace";
import StackedToGroupedBars from "./E12StackedToGroupedBars";
import StreamgraphTransition from "./E13StreamgraphTransition";
import SmoothZooming from "./E14SmoothZooming";
import ZoomToBoundingBox from "./E15ZoomToBoundingBox";
import OrthographicToEquirectangualr from "./E16OrthographicToEquirectangular";
import WorldTour from "./E17WorldTour";
import WalmartsGrowth from "./E18WalmartsGrowth";
import HierarchicalBarChart from "./E19HierarchicalBarChart";
import ZoomableTreemap from "./E20ZoomableTreemap";
import ZoomableCirclePacking from "./E21ZoomableCirclePacking";
import CollapsibleTree from "./E22CollapsibleTree";
import ZoomableIcicle from "./E23ZoomableIcicle";
import ZoomableSunburst from "./E24ZoomableSunburst";
import SortableBarChart from "./E25SortableBarChart";
import IcelandicPopulation from "./E26IcelandicPopulation";
import IndexChart from "./E27IndexChart";
import SequencesSunburst from "./E28SequencesSunburst";
import BrushableScatterplotMatrix from "./E29BrushableScatterplotMatrix";
import ZoomableAreaChart from "./E30ZoomableAreaChart";
import ZoomableBarChart from "./E31ZoomableBarChart";
import BollingerBands from "./E32BollingerBands";
import BoxPlot from "./E33BoxPlot";
import KernelDensityEstimation from "./E34KernelDensityEstimation";
import DensityContours from "./E35DensityContours";
import Contours from "./E36Contours";
import QQPlot from "./E37QQPlot";
import ParallelSets from "./E38ParallelSets";
import TreeMap from "./E39Treemap";
import NestedTreeMap from "./E40NestedTreemap";
import CirclePacking from "./E41CirclePacking";
import IndentedTree from "./E42IndentedTree";
import TidyTree from "./E43TidyTree";
import RadialTidyTree from "./E44RadialTidyTree";
import ClusterDendrogram from "./E45ClusterDendrogram";
import RadialDendrogram from "./E46RadialDendrogram";
import TangledTreeVisualization from "./E47TangledTreeVisualization";
import TreeOfLife from "./E48TreeOfLife";
import ForceDirectedTree from "./E49ForceDirectedTree";
import ForceDirectedGraph from "./E50ForceDirectedGraph";
import DisjointForceDirectedGraph from "./E51DisjointForceDirectedGraph";
import MobilePatentSuits from "./E52MobilePatentSuits";
import ArcDiagram from "./E53ArcDiagram";
import SankeyDiagram from "./E54SankeyDiagram";
import HierarchicalEdgeBundling from "./E55HierarchicalEdgeBundling";
import HierarchicalEdgeBundling2 from "./E56HierarchicalEdgeBundling2";
import ChordDependencyDiagram from "./E57ChordDependencyDiagram";
import HorizontalBarChart from "./E58HorizontalBarChart";
import DivergingBarChart from "./E59DivergingBarChart";
import StackedBarChart from "./E60StackedBarChart";
import GroupedBarChart from "./E61GroupedBarChart";
import ImpactOfVaccines from "./E62ImpactOfVaccines";
import ElectricUsage2019 from "./E63ElectricUsage2019";
import CandlestickChart from "./E64CandlestickChart";
import VariableColorLine from "./E65VariableColorLine";
import ParallelCoordinates from "./E66ParallelCoordinates";
import InequalityInAmericanCities from "./E67InequalityInAmericanCities";
import NewZealandTourists from "./E68NewZealandTourists";
import SeaIceExtent from "./E69SeaIceExtent";
import StackedAreaChart from "./E70StackedAreaChart";
import Streamgraph from "./E71Streamgraph";
import DifferenceChart from "./E72DifferenceChart";
import RidgelinePlot from "./E73RidgelinePlot";
import RealtimeHorizonChart from "./E74RealtimeHorizonChart";
import GlobalTemperatureTrends from "./E75GlobalTemperatureTrends";
import ScatterplotWithShapes from "./E76ScatterplotWithShapes";
import ScatterplotMatrix from "./E77ScatterplotMatrix";
import ScatterPlot from "./E78ScatterPlot";
import HertzsprungRussellDiagram from "./E79HertzsprungRussellDiagram";
import PieChart from "./E80PieChart";
import DonutChart from "./E81DonutChart";
import RadiaAreaChart from "./E82RadialAreaChart";
import InlineLabels from "./E83InlineLabels";
import LineChartWidthTooptip from "./E84LineChartWithTooltip";
import VoronoiLabels from "./E85VoronoiLabels";
import Tadpoles from "./E86Tadpoles";
import PolarClock from "./E87PolarClock";
import SternBrocotTree from "./E88SternBrocotTree";
import EpicyclicGearing from "./E89EpicyclicGearing";
import OwlsToTheMax from "./E90OwlsToTheMax";
import WordCloud from "./E91WordCloud";
import PredatorAndPrey from "./E92PredatorAndPrey";
import RotatingVoronoi from "./E93RotatingVoronoi";
import VectorField from "./E94VectorField";
import Occlusion from "./E95Occlusion";

const drawerWidth = 280;

const useStyles = makeStyles({
  root: {
    display: "flex",
  },
  appBar: {
    transition: ["margin 200ms ease-in-out", "width 200ms ease-in-out"],
  },
  toolBar: {
    minHeight: 48,
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
  },
  menuButton: {
    marginRight: 16,
  },
  hide: {
    display: "none",
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 8px",
    minHeight: 48,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    transition: "margin 200ms ease-in-out",
    marginLeft: -drawerWidth,
  },
  contentShift: {
    marginLeft: 0,
  },
});

const d3Examples = [
  {
    name: "1. Bar Chart",
    comp: (props) => <BarChart {...props} />,
  },
  {
    name: "2. Line Chart",
    comp: (props) => <LineChart {...props} />,
  },
  {
    name: "3. Multi-Line Chart",
    comp: (props) => <MultiLineChart {...props} />,
  },
  {
    name: "4. Animated Colorful Bar Chart",
    comp: (props) => <AnimatedColorfulBarChart {...props} />,
  },
  {
    name: "5. Sunrise And Sunset",
    comp: (props) => <SunriseAndSunset {...props} />,
  },
  {
    name: "6. Three Nodes",
    comp: (props) => <ThreeNodes {...props} />,
  },
  {
    name: "7. Animated Treemap",
    comp: (props) => <AnimatedTreemap {...props} />,
  },
  {
    name: "8. Connected Scatterplot",
    comp: (props) => <ConnectedScatterplot {...props} />,
  },
  {
    name: "9. Gapminder",
    comp: (props) => <Gapminder {...props} />,
  },
  {
    name: "10. Scatterplot Tour",
    comp: (props) => <ScatterplotTour {...props} />,
  },
  {
    name: "11. Bar Chart Race",
    comp: (props) => <BarChartRace {...props} />,
  },
  {
    name: "12. Stacked To GroupedBars",
    comp: (props) => <StackedToGroupedBars {...props} />,
  },
  {
    name: "13. Streamgraph Transition",
    comp: (props) => <StreamgraphTransition {...props} />,
  },
  {
    name: "14. Smooth Zooming",
    comp: (props) => <SmoothZooming {...props} />,
  },
  {
    name: "15. Zoom To Bounding Box",
    comp: (props) => <ZoomToBoundingBox {...props} />,
  },
  {
    name: "16. Orthographic To Equirect",
    comp: (props) => <OrthographicToEquirectangualr {...props} />,
  },
  {
    name: "17. World Tour",
    comp: (props) => <WorldTour {...props} />,
  },
  {
    name: "18. Walmarts Growth",
    comp: (props) => <WalmartsGrowth {...props} />,
  },
  {
    name: "19. Hierarchical Bar Chart",
    comp: (props) => <HierarchicalBarChart {...props} />,
  },
  {
    name: "20. Zoomable Treemap",
    comp: (props) => <ZoomableTreemap {...props} />,
  },
  {
    name: "21. Zoomable Circle Packing",
    comp: (props) => <ZoomableCirclePacking {...props} />,
  },
  {
    name: "22. Collapsible Tree",
    comp: (props) => <CollapsibleTree {...props} />,
  },
  {
    name: "23. Zoomable Icicle",
    comp: (props) => <ZoomableIcicle {...props} />,
  },
  {
    name: "24. Zoomable Sunburst",
    comp: (props) => <ZoomableSunburst {...props} />,
  },
  {
    name: "25. Sortable Bar Chart",
    comp: (props) => <SortableBarChart {...props} />,
  },
  {
    name: "26. Icelandic Population",
    comp: (props) => <IcelandicPopulation {...props} />,
  },
  {
    name: "27. Index Chart",
    comp: (props) => <IndexChart {...props} />,
  },
  {
    name: "28. Sequences Sunburst",
    comp: (props) => <SequencesSunburst {...props} />,
  },
  {
    name: "29. Brushable Scatterplot Matrix",
    comp: (props) => <BrushableScatterplotMatrix {...props} />,
  },
  {
    name: "30. Zoomable Area Chart",
    comp: (props) => <ZoomableAreaChart {...props} />,
  },
  {
    name: "31. Zoomable Bar Chart",
    comp: (props) => <ZoomableBarChart {...props} />,
  },
  {
    name: "32. Bollinger Bands",
    comp: (props) => <BollingerBands {...props} />,
  },
  {
    name: "33. Box Plot",
    comp: (props) => <BoxPlot {...props} />,
  },
  {
    name: "34. Kernel Density Estimation",
    comp: (props) => <KernelDensityEstimation {...props} />,
  },
  {
    name: "35. Density Contours",
    comp: (props) => <DensityContours {...props} />,
  },
  {
    name: "36. Contours",
    comp: (props) => <Contours {...props} />,
  },
  {
    name: "37. Q-Q Plot",
    comp: (props) => <QQPlot {...props} />,
  },
  {
    name: "38. Parallel Sets",
    comp: (props) => <ParallelSets {...props} />,
  },
  {
    name: "39. TreeMap",
    comp: (props) => <TreeMap {...props} />,
  },
  {
    name: "40. Nested TreeMap",
    comp: (props) => <NestedTreeMap {...props} />,
  },
  {
    name: "41. Circle Packing",
    comp: (props) => <CirclePacking {...props} />,
  },
  {
    name: "42. Indented Tree",
    comp: (props) => <IndentedTree {...props} />,
  },
  {
    name: "43. Tidy Tree",
    comp: (props) => <TidyTree {...props} />,
  },
  {
    name: "44. Radial Tidy Tree",
    comp: (props) => <RadialTidyTree {...props} />,
  },
  {
    name: "45. Cluster Dendrogram",
    comp: (props) => <ClusterDendrogram {...props} />,
  },
  {
    name: "46. Radial Dendrogram",
    comp: (props) => <RadialDendrogram {...props} />,
  },
  {
    name: "47. Tangled Tree Visualization",
    comp: (props) => <TangledTreeVisualization {...props} />,
  },
  {
    name: "48. Tree Of Life",
    comp: (props) => <TreeOfLife {...props} />,
  },
  {
    name: "49. Force Directed Tree",
    comp: (props) => <ForceDirectedTree {...props} />,
  },
  {
    name: "50. Force Directed Graph",
    comp: (props) => <ForceDirectedGraph {...props} />,
  },
  {
    name: "51. Disjoint Force Directed Graph",
    comp: (props) => <DisjointForceDirectedGraph {...props} />,
  },
  {
    name: "52. Mobile Patent Suits",
    comp: (props) => <MobilePatentSuits {...props} />,
  },
  {
    name: "53. Arc Diagram",
    comp: (props) => <ArcDiagram {...props} />,
  },
  {
    name: "54. Sankey Diagram",
    comp: (props) => <SankeyDiagram {...props} />,
  },
  {
    name: "55. Hierarchical Edge Bundling",
    comp: (props) => <HierarchicalEdgeBundling {...props} />,
  },
  {
    name: "56. Hierarchical Edge Bundling 2",
    comp: (props) => <HierarchicalEdgeBundling2 {...props} />,
  },
  {
    name: "57. Chord Dependency Diagram",
    comp: (props) => <ChordDependencyDiagram {...props} />,
  },
  {
    name: "58. Horizontal Bar Chart",
    comp: (props) => <HorizontalBarChart {...props} />,
  },
  {
    name: "59. Diverging Bar Chart",
    comp: (props) => <DivergingBarChart {...props} />,
  },
  {
    name: "60. Stacked Bar Chart",
    comp: (props) => <StackedBarChart {...props} />,
  },
  {
    name: "61. Grouped Bar Chart",
    comp: (props) => <GroupedBarChart {...props} />,
  },
  {
    name: "62. Impact Of Vaccines",
    comp: (props) => <ImpactOfVaccines {...props} />,
  },
  {
    name: "63. Electric Usage 2019",
    comp: (props) => <ElectricUsage2019 {...props} />,
  },
  {
    name: "64. Candlestick Chart",
    comp: (props) => <CandlestickChart {...props} />,
  },
  {
    name: "65. Variable Color Line",
    comp: (props) => <VariableColorLine {...props} />,
  },
  {
    name: "66. Parallel Coordinates",
    comp: (props) => <ParallelCoordinates {...props} />,
  },
  {
    name: "67. Inequality In American Cities",
    comp: (props) => <InequalityInAmericanCities {...props} />,
  },
  {
    name: "68. New Zealand Tourists",
    comp: (props) => <NewZealandTourists {...props} />,
  },
  {
    name: "69. Sea Ice Extent",
    comp: (props) => <SeaIceExtent {...props} />,
  },
  {
    name: "70. Stacked Area Chart",
    comp: (props) => <StackedAreaChart {...props} />,
  },
  {
    name: "71. Streamgraph",
    comp: (props) => <Streamgraph {...props} />,
  },
  {
    name: "72. Difference Chart",
    comp: (props) => <DifferenceChart {...props} />,
  },
  {
    name: "73. Ridgeline Plot",
    comp: (props) => <RidgelinePlot {...props} />,
  },
  {
    name: "74. Realtime Horizon Chart",
    comp: (props) => <RealtimeHorizonChart {...props} />,
  },
  {
    name: "75. Global Temperature Trends",
    comp: (props) => <GlobalTemperatureTrends {...props} />,
  },
  {
    name: "76. Scatterplot With Shapes",
    comp: (props) => <ScatterplotWithShapes {...props} />,
  },
  {
    name: "77. Scatterplot Matrix",
    comp: (props) => <ScatterplotMatrix {...props} />,
  },
  {
    name: "78. Scatter Plot",
    comp: (props) => <ScatterPlot {...props} />,
  },
  {
    name: "79. Hertzsprung Russell Diagram",
    comp: (props) => <HertzsprungRussellDiagram {...props} />,
  },
  {
    name: "80. Pie Chart",
    comp: (props) => <PieChart {...props} />,
  },
  {
    name: "81. Donut Chart",
    comp: (props) => <DonutChart {...props} />,
  },
  {
    name: "82. Radia Area Chart",
    comp: (props) => <RadiaAreaChart {...props} />,
  },
  {
    name: "83. Inline Labels",
    comp: (props) => <InlineLabels {...props} />,
  },
  {
    name: "84. Line Chart Width Tooptip",
    comp: (props) => <LineChartWidthTooptip {...props} />,
  },
  {
    name: "85. Voronoi Labels",
    comp: (props) => <VoronoiLabels {...props} />,
  },
  {
    name: "86. Tadpoles",
    comp: (props) => <Tadpoles {...props} />,
  },
  {
    name: "87. Polar Clock",
    comp: (props) => <PolarClock {...props} />,
  },
  {
    name: "88. Stern Brocot Tree",
    comp: (props) => <SternBrocotTree {...props} />,
  },
  {
    name: "89. Epicyclic Gearing",
    comp: (props) => <EpicyclicGearing {...props} />,
  },
  {
    name: "90. Owls To The Max",
    comp: (props) => <OwlsToTheMax {...props} />,
  },
  {
    name: "91. Word Cloud",
    comp: (props) => <WordCloud {...props} />,
  },
  {
    name: "92. Predator And Prey",
    comp: (props) => <PredatorAndPrey {...props} />,
  },
  {
    name: "93. Rotating Voronoi",
    comp: (props) => <RotatingVoronoi {...props} />,
  },
  {
    name: "94. Vector Field",
    comp: (props) => <VectorField {...props} />,
  },
  {
    name: "95. Occlusion",
    comp: (props) => <Occlusion {...props} />,
  },
];

const App = (props) => {
  const classes = useStyles();

  const [open, setOpen] = React.useState(true);
  const [compIndex, setCompIndex] = React.useState(51);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const handleSelectComp = (index) => () => setCompIndex(index);

  execute();

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, { [classes.appBarShift]: open })}
      >
        <Toolbar className={classes.toolBar}>
          <IconButton
            onClick={handleDrawerOpen}
            edge="start"
            className={clsx(classes.menuButton, open && classes.hide)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Study D3 -> {d3Examples[compIndex].name}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        className={classes.drawer}
        classes={{ paper: classes.drawerPaper }}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List>
          {d3Examples.map((example, i) => (
            <ListItem
              button
              key={example.name}
              onClick={handleSelectComp(i)}
              style={{ margin: 0, padding: "0 10px" }}
            >
              <ListItemText primary={example.name} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <main className={clsx(classes.content, { [classes.contentShift]: open })}>
        <div className={classes.drawerHeader} />
        <div>{d3Examples[compIndex].comp()}</div>
      </main>
    </div>
  );
};

export default App;
