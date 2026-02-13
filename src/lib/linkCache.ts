const cache = new Map<string, any>();

export async function getCachedLinkPreview(href: string, fetcher: (url: string) => Promise<any>) {
  if (cache.has(href)) {
    return cache.get(href);
  }
  
  const data = await fetcher(href);

  cache.set(href, data);
  return data;
}
