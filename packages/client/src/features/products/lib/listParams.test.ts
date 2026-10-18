import { describe, expect, it } from 'vitest';
import {
  LIST_DEFAULTS,
  listParamsToQuery,
  paramUpdates,
  parseListSearchParams,
  serializeListParams,
} from './listParams';

function search(params: Record<string, string> = {}): URLSearchParams {
  return new URLSearchParams(params);
}

describe('parseListSearchParams', () => {
  it('applies defaults for an empty URL', () => {
    expect(parseListSearchParams(search())).toEqual({
      q: undefined,
      category: undefined,
      sortBy: 'name',
      order: 'asc',
      page: 1,
      limit: 12,
    });
  });

  it('reads every supported param', () => {
    const params = parseListSearchParams(
      search({
        q: 'jacket',
        category: 'beauty',
        sortBy: 'price',
        order: 'desc',
        page: '3',
        limit: '24',
      })
    );

    expect(params).toEqual({
      q: 'jacket',
      category: 'beauty',
      sortBy: 'price',
      order: 'desc',
      page: 3,
      limit: 24,
    });
  });

  it('falls back for an unknown sort field or order rather than passing it to the API', () => {
    const params = parseListSearchParams(search({ sortBy: '; DROP TABLE', order: 'sideways' }));

    expect(params.sortBy).toBe(LIST_DEFAULTS.sortBy);
    expect(params.order).toBe(LIST_DEFAULTS.order);
  });

  it('falls back for page and limit that are not positive integers', () => {
    expect(parseListSearchParams(search({ page: '0' })).page).toBe(1);
    expect(parseListSearchParams(search({ page: '-4' })).page).toBe(1);
    expect(parseListSearchParams(search({ page: 'abc' })).page).toBe(1);
    expect(parseListSearchParams(search({ limit: '0' })).limit).toBe(LIST_DEFAULTS.limit);
  });

  it('reads an out-of-range page as-is, leaving the range to the server', () => {
    // The listing must still render "Page 999 of 10" rather than silently clamping.
    expect(parseListSearchParams(search({ page: '999' })).page).toBe(999);
  });
});

describe('paramUpdates', () => {
  it('sets provided values', () => {
    const next = paramUpdates(search({ q: 'old' }), search({ q: 'new' }), false);

    expect(next.get('q')).toBe('new');
  });

  it('deletes keys given an empty value, so a bare ?q= never survives', () => {
    const next = paramUpdates(
      search({ q: 'jacket', category: 'beauty' }),
      search({ q: '' }),
      false
    );

    expect(next.has('q')).toBe(false);
    expect(next.get('category')).toBe('beauty');
  });

  it('drops the page when resetPage is set', () => {
    const next = paramUpdates(search({ page: '4', q: 'x' }), search({ q: 'y' }), true);

    expect(next.has('page')).toBe(false);
    expect(next.get('q')).toBe('y');
  });

  it('keeps the page when resetPage is not set', () => {
    // Sorting reorders what is on screen, so it must not send you back to page 1.
    const next = paramUpdates(
      search({ page: '4' }),
      search({ sortBy: 'price', order: 'asc' }),
      false
    );

    expect(next.get('page')).toBe('4');
  });

  it('leaves unrelated params untouched', () => {
    const next = paramUpdates(
      search({ q: 'x', category: 'beauty' }),
      search({ sortBy: 'price' }),
      false
    );

    expect(next.get('category')).toBe('beauty');
  });
});

describe('serializeListParams', () => {
  it('is stable for the same params and differs when any one changes', () => {
    const base = parseListSearchParams(search({ q: 'a' }));
    const same = parseListSearchParams(search({ q: 'a' }));
    const changed = parseListSearchParams(search({ q: 'b' }));

    expect(serializeListParams(base)).toBe(serializeListParams(same));
    expect(serializeListParams(base)).not.toBe(serializeListParams(changed));
  });

  it('separates fields, so adjacent values cannot collide', () => {
    const a = parseListSearchParams(search({ q: 'a', category: 'b' }));
    const b = parseListSearchParams(search({ q: 'ab' }));

    expect(serializeListParams(a)).not.toBe(serializeListParams(b));
  });
});

describe('listParamsToQuery', () => {
  it('always sends resolved defaults, so the request never depends on the server defaults', () => {
    const query = listParamsToQuery(parseListSearchParams(search()));

    expect(query).toEqual({
      q: undefined,
      category: undefined,
      sortBy: 'name',
      order: 'asc',
      page: 1,
      limit: 12,
    });
  });

  it('takes the category from the argument, so a route can lock it', () => {
    const query = listParamsToQuery(
      parseListSearchParams(search({ category: 'ignored' })),
      'beauty'
    );

    expect(query.category).toBe('beauty');
  });
});
