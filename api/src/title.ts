export const parseTitle = (html: string) =>
  html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
