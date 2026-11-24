import { useEffect } from "react";
import { Image } from "expo-image";
import { resolveMediaUrl } from "@/lib/utils/media";
import type { BookCardBook } from "@/types/book";

type Page = { data: { results: BookCardBook[] } };
type Feed = {
  data?: { pages: Page[] };
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchNextPageError: boolean;
  fetchNextPage: (options?: { cancelRefetch?: boolean }) => Promise<unknown>;
};

/** Keep one extra page ready and cache a bounded set of its cover images. */
export function useBookFeedWarmup({ data, hasNextPage, isFetching, isFetchNextPageError, fetchNextPage }: Feed) {
  const pages = data?.pages;
  const pageCount = pages?.length;
  useEffect(() => {
    if (pageCount === 1 && hasNextPage && !isFetching && !isFetchNextPageError) {
      fetchNextPage({ cancelRefetch: false });
    }
  }, [pageCount, hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);

  useEffect(() => {
    if (!pages?.length) return;
    const books = pages[pages.length - 1].data.results;
    const urls = [...new Set(books.slice(0, 12).map((book) => {
      const raw = book as BookCardBook & { cover_image_url?: string; cover_image?: string; coverImage?: string; image?: string };
      return resolveMediaUrl(raw.coverUrl || raw.cover_image_url || raw.cover_image || raw.coverImage || raw.image);
    }).filter(Boolean))];
    if (urls.length) Image.prefetch(urls, "disk").catch(() => {});
  }, [pages]);
}
