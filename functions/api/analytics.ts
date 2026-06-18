export async function onRequestPost({ request, env }: any) {
  const { query, variables } = await request.json();
  const analyticsVariables = {
    ...injectCloudflareEnv(variables ?? {}, env),
    accountTag: env.CLOUDFLARE_ACCOUNT_TAG,
    siteTag: env.CLOUDFLARE_SITE_TAG,
  };

  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    },
    body: JSON.stringify({
      query,
      variables: analyticsVariables,
    }),
  });

  return Response.json(await response.json(), {
    status: response.status,
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}

function injectCloudflareEnv(value: any, env: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => injectCloudflareEnv(item, env));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        injectCloudflareEnv(nestedValue, env),
      ]),
    );
  }

  if (value === "__CLOUDFLARE_SITE_TAG__") {
    return env.CLOUDFLARE_SITE_TAG;
  }

  return value;
}
