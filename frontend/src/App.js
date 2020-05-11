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

// import AnimatedColorfulBarChart from "./AnimatedColorfulBarChart";
// import ThreeNodes from "./ThreeNodes";
// import SimpleBarChart from "./SimpleBarChart";
// import SunriseAndSunset from "./SunriseAndSunset";
// import SimpleLineChart from "./SimpleLineChart";
// import MultiLineChart from "./MultiLineChart";
import AnimatedTreemap from "./AnimatedTreemap";

const drawerWidth = 240;

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
  // {
  //   name: "Animated Colorful Bar Chart",
  //   comp: (props) => <AnimatedColorfulBarChart {...props} />,
  // },
  // {
  //   name: "Three Nodes",
  //   comp: (props) => <ThreeNodes {...props} />,
  // },
  // {
  //   name: "Simple Bar Chart",
  //   comp: (props) => <SimpleBarChart {...props} />,
  // },
  // {
  //   name: "Sunrise And Sunset",
  //   comp: (props) => <SunriseAndSunset {...props} />,
  // },
  // {
  //   name: "Simple Line Chart",
  //   comp: (props) => <SimpleLineChart {...props} />,
  // },
  // {
  //   name: "Multi-Line Chart",
  //   comp: (props) => <MultiLineChart {...props} />,
  // },
  {
    name: "Animated Treemap",
    comp: (props) => <AnimatedTreemap {...props} />,
  },
];

const App = (props) => {
  const classes = useStyles();

  const [open, setOpen] = React.useState(true);
  const [compIndex, setCompIndex] = React.useState(0);

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
            Study D3
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
            <ListItem button key={example.name} onClick={handleSelectComp(i)}>
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
