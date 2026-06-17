export async function onRequestPost({ request, env }: any) {
  const { query, variables } = await request.json();

  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    },
    body: JSON.stringify({
      query,
      variables: {
        ...variables,
        accountTag: env.CLOUDFLARE_ACCOUNT_TAG,
        siteTag: env.CLOUDFLARE_SITE_TAG,
      },
    }),
  });

  return Response.json(await response.json(), {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
