const CLOUDFLARE_BASE_URL = import.meta.env.DEV
  ? "/api/cloudflare/client/v4/graphql"
  : import.meta.env.VITE_CLOUDFLARE_PROXY_URL;
/* Cloudflare gives CORS errors if the BASE_URL is used directly, hence a proxy is setup */

// New method use pages functions n secrets, this is not req now:
//const CLOUDFLARE_API_TOKEN = import.meta.env.VITE_CLOUDFLARE_API_TOKEN;
//
const ANALYTICS_API = "/api/analytics";

export async function fetchWebAnalyticsAggregate(from: Date, to: Date) {
  const query: string = `query GetRumPageloadEvents(
    $accountTag: string!
    $siteTag: string!
    $from: Time!
    $to: Time!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        rumPageloadEventsAdaptiveGroups(
          limit: 10
          filter: { datetime_geq: $from, datetime_leq: $to, siteTag: $siteTag }
          orderBy: [sum_visits_DESC]
        ) {
          count
          sum {
            visits
          }
        }
      }
    }
  }`;

  //   const variables = {
  //     accountTag: `${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_TAG}`,
  //     siteTag: `${import.meta.env.VITE_CLOUDFLARE_SITE_TAG}`,
  //     from: from.toISOString(),
  //     to: to.toISOString(),
  //   };
  //
  //   const headers: HeadersInit = {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
  //   };

  const response = await fetch(ANALYTICS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Error fetching web analytics: ${response.statusText}`);
  }

  const result = await response.json();

  // Extract and transform the data
  const groups =
    result?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups?.[0];

  if (!groups) {
    return {
      pageViews: 0,
      visits: 0,
      avgDuration: 0,
      bounceRate: 0,
    };
  }

  return {
    pageViews: groups.count || 0,
    visits: groups.sum?.visits || 0,
  };
}

export async function fetchWebAnalyticsBrowser(from: Date, to: Date) {
  const query: string = `query GetRumPageloadEvents(
    $accountTag: string!
    $siteTag: string!
    $from: Time!
    $to: Time!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        rumPageloadEventsAdaptiveGroups(
          limit: 10
          filter: { datetime_geq: $from, datetime_leq: $to, siteTag: $siteTag }
          orderBy: [sum_visits_DESC]
        ) {
          dimensions {
            userAgentBrowser
          }
          count
          sum {
            visits
          }
        }
      }
    }
  }`;

  //   const variables = {
  //     accountTag: `${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_TAG}`,
  //     siteTag: `${import.meta.env.VITE_CLOUDFLARE_SITE_TAG}`,
  //     from: from.toISOString(),
  //     to: to.toISOString(),
  //   };
  //
  //   const headers: HeadersInit = {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
  //   };

  const response = await fetch(ANALYTICS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Error fetching web analytics: ${response.statusText}`);
  }

  const result = await response.json();

  // Extract and transform the data
  const groups =
    result?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups;

  if (!groups || groups.length === 0) {
    return [];
  }

  return groups.map((group: any) => ({
    browser: group.dimensions?.userAgentBrowser || "Unknown",
    count: group.count || 0,
    visits: group.sum?.visits || 0,
  }));
}

export async function fetchWebAnalyticsOS(from: Date, to: Date) {
  const query: string = `query GetRumPageloadEvents(
    $accountTag: string!
    $siteTag: string!
    $from: Time!
    $to: Time!
  ) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        rumPageloadEventsAdaptiveGroups(
          limit: 10
          filter: { datetime_geq: $from, datetime_leq: $to, siteTag: $siteTag }
          orderBy: [sum_visits_DESC]
        ) {
          dimensions {
            userAgentOS
          }
          count
          sum {
            visits
          }
        }
      }
    }
  }`;

  //   const variables = {
  //     accountTag: `${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_TAG}`,
  //     siteTag: `${import.meta.env.VITE_CLOUDFLARE_SITE_TAG}`,
  //     from: from.toISOString(),
  //     to: to.toISOString(),
  //   };
  //
  //   const headers: HeadersInit = {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
  //   };

  const response = await fetch(ANALYTICS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Error fetching web analytics: ${response.statusText}`);
  }

  const result = await response.json();

  // Extract and transform the data
  const groups =
    result?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups;

  if (!groups || groups.length === 0) {
    return [];
  }

  return groups.map((group: any) => ({
    os: group.dimensions?.userAgentOS || "Unknown",
    count: group.count || 0,
    visits: group.sum?.visits || 0,
  }));
}

export async function fetchWebAnalyticsSparkline(from: Date, to: Date) {
  const query: string = `query RumSparklineBydatetimeFifteenMinutes($accountTag: string, $filter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject, $visitsFilter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject, $pageviewsFilter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject, $performanceFilter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject, $deltaFilter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject, $pageviewsDeltaFilter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject, $visitsDeltaFilter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject, $performanceDeltaFilter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject, $lcpFilter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject, $inpFilter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject, $clsFilter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject) {
    viewer {
      accounts(filter: {accountTag: $accountTag}) {
        visits: rumPageloadEventsAdaptiveGroups(limit: 5000, filter: $visitsFilter) {
          sum {
            visits
            __typename
          }
          avg {
            sampleInterval
            __typename
          }
          dimensions {
            ts: datetimeFifteenMinutes
            __typename
          }
          __typename
        }
        pageviews: rumPageloadEventsAdaptiveGroups(limit: 5000, filter: $pageviewsFilter) {
          count
          avg {
            sampleInterval
            __typename
          }
          dimensions {
            ts: datetimeFifteenMinutes
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
  }`;

  const fromISO = from.toISOString();
  const toISO = to.toISOString();

  // Calculate previous period for delta
  const prevFrom = new Date(from);
  prevFrom.setDate(
    prevFrom.getDate() -
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
  );
  const prevFromISO = prevFrom.toISOString();

  const filterBase = {
    AND: [
      {
        datetime_geq: fromISO,
        datetime_leq: toISO,
      },
      {
        OR: [
          {
            siteTag: import.meta.env.VITE_CLOUDFLARE_SITE_TAG,
          },
        ],
      },
      {
        bot: 0,
      },
    ],
  };

  const deltaFilterBase = {
    AND: [
      {
        datetime_geq: prevFromISO,
        datetime_leq: fromISO,
      },
      {
        OR: [
          {
            siteTag: import.meta.env.VITE_CLOUDFLARE_SITE_TAG,
          },
        ],
      },
      {
        bot: 0,
      },
    ],
  };

  const variables = {
    filter: filterBase,
    visitsFilter: filterBase,
    pageviewsFilter: filterBase,
    performanceFilter: filterBase,
    deltaFilter: deltaFilterBase,
    visitsDeltaFilter: deltaFilterBase,
    pageviewsDeltaFilter: deltaFilterBase,
    performanceDeltaFilter: deltaFilterBase,
    lcpFilter: filterBase,
    clsFilter: filterBase,
    inpFilter: filterBase,
  };

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    //Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
  };

  const response = await fetch(CLOUDFLARE_BASE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Error fetching web analytics sparkline: ${response.statusText}`,
    );
  }

  const result = await response.json();

  const accounts = result?.data?.viewer?.accounts?.[0];

  if (!accounts) {
    return {
      visits: [],
      pageviews: [],
    };
  }

  // Transform visits data
  const visits = (accounts.visits || [])
    .filter((item: any) => item.dimensions?.ts && item.sum?.visits)
    .map((item: any) => ({
      timestamp: item.dimensions.ts,
      visits: item.sum.visits,
    }))
    .sort(
      (a: any, b: any) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

  // Transform pageviews data
  const pageviews = (accounts.pageviews || [])
    .filter((item: any) => item.dimensions?.ts && item.count)
    .map((item: any) => ({
      timestamp: item.dimensions.ts,
      pageviews: item.count,
    }))
    .sort(
      (a: any, b: any) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

  return {
    visits,
    pageviews,
  };
}
