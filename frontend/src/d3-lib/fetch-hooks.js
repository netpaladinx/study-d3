import React from "react";
import { text as d3text, csv as d3csv, tsv as d3tsv } from "d3-fetch";

const fetchAndParse = async (url, parse) => {
  let result;
  if (parse) {
    result = parse(await d3text(url));
  } else {
    if (url.endsWith(".csv")) {
      result = await d3csv(url);
    } else if (url.endsWith(".tsv")) {
      result = await d3tsv(url);
    }
  }
  return result;
};

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

export const useDataApi = ({
  url: initUrl,
  parse: initParse,
  data: initData,
}) => {
  const [url, setUrl] = React.useState(initUrl);
  const [parse, setParse] = React.useState(initParse);

  const [state, dispatch] = React.useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initData,
  });

  const doFetch = (url, parse) => {
    setUrl(url);
    setParse(parse);
  };

  React.useEffect(() => {
    let didCancel = false;

    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });

      try {
        const result = await fetchAndParse(url, parse);

        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();

    return () => {
      didCancel = true;
    };
  }, [url, parse]);

  return [state, doFetch];
};
