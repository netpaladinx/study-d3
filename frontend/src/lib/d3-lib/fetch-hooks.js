import React from "react";
import { text as d3text, csv as d3csv, tsv as d3tsv } from "d3-fetch";

import { useDataFetch } from "../hooks";

const fetchAndParse = async ({ url, parse }) => {
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

export const useDataFetchByUrlAndParse = (
  initialUrl,
  initialParse,
  initialData = null
) => {
  const [urlAndParse, setUrlAndParse] = React.useState({
    url: initialUrl,
    parse: initialParse,
  });

  const state = useDataFetch(fetchAndParse, urlAndParse, initialData);

  const doFetch = (url, parse) => {
    setUrlAndParse((state) => ({
      url: url || state.url,
      parse: parse || state.parse,
    }));
  };

  return [state, doFetch];
};
