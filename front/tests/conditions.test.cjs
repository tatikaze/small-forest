const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest } = require('next/server');
const loader = require('./load-ts.cjs');
// Never use real Redis credentials inherited by the test process.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
const range = loader()('src/lib/condition-range.ts');
const DAY = range.DAY_MS;
const sample = (time, temperature = 20, humidity = 50) => ({
  device_name: 'reid', created_unix: time, created_at: new Date(time).toISOString(), temperature, humidity,
});

test('JST legacy, UTC and explicit offsets represent the same instant', () => {
  assert.equal(range.parseConditionDate('2026-01-01T09:00'), Date.parse('2026-01-01T00:00Z'));
  assert.equal(range.parseConditionDate('2026-01-01T09:00:00+09:00'), range.parseConditionDate('2026-01-01T00:00:00Z'));
  for (const value of ['invalid', '2026-02-30T10:00', '2026-01-01', '2026-01-01T25:00']) {
    assert.ok(Number.isNaN(range.parseConditionDate(value)), value);
  }
});

test('range limits cover invalid, reversed, equal, future and exact 31-day boundaries', () => {
  const end = Date.parse('2026-02-01T00:00Z');
  assert.equal(range.rangeError(end - 31 * DAY, end, end), null);
  for (const [start, finish] of [[NaN, end], [end, end], [end + 1, end], [end - 31 * DAY - 1, end], [end - 1, end + 1]]) {
    assert.ok(range.rangeError(start, finish, end));
  }
});

test('automatic resolution bounds long-range graph size and computes means', () => {
  assert.deepEqual([2, 24, 168, 744].map(hours => range.intervalMinutes(0, hours * 3600000)), [0, 5, 30, 120]);
  const rows = [sample(0, 10, 40), sample(60000, 20, 60), sample(1800000, 30, 70)];
  const result = range.aggregateConditions(rows, 30);
  assert.equal(result.length, 2);
  assert.equal(result[0].temperature, 15);
  assert.equal(result[0].humidity, 50);
  assert.equal(range.aggregateConditions(rows, 0), rows);
});

function harness(rows = [], override) {
  const calls = [];
  const load = loader({ '~/lib/dynamodb': { ddbDocClient: { send: async command => {
    calls.push(command.input);
    if (override) return override(command.input);
    const input = command.input;
    if (input.ScanIndexForward === false) return { Items: rows.slice(-1) };
    const matching = rows.filter(row => row.created_unix >= input.ExpressionAttributeValues[':s'] && row.created_unix <= input.ExpressionAttributeValues[':e']);
    const index = input.ExclusiveStartKey?.index ?? 0;
    const page = matching.slice(index, index + input.Limit);
    return { Items: page, ScannedCount: page.length, ...(index + page.length < matching.length ? { LastEvaluatedKey: { index: index + page.length } } : {}) };
  } } } });
  const { conditionHistoryGET } = load('src/lib/condition-history.ts');
  const request = (start, end, extra = { include_now: 'false' }) => conditionHistoryGET(
    new NextRequest(`http://localhost/api/v1/reid/conditions?${new URLSearchParams({ start_date: start, end_date: end, ...extra })}`),
    { params: Promise.resolve({ device: 'reid' }) },
  );
  return { calls, request, load };
}

test('invalid API inputs never access the DB', async () => {
  const h = harness();
  for (const [start, end] of [['bad', 'bad'], ['2026-01-02T00:00Z', '2026-01-01T00:00Z'], ['2026-01-01T00:00Z', '2026-03-01T00:00Z'], ['2999-01-01T00:00Z', '2999-01-02T00:00Z']]) {
    assert.equal((await h.request(start, end)).status, 400);
  }
  assert.equal(h.calls.length, 0);
});

test('overlapping requests reuse cached days and filter exact boundaries', async () => {
  const day = Date.parse('2026-01-01T00:00Z');
  const h = harness([sample(day), sample(day + 300000), sample(day + 600000)]);
  let response = await h.request('2026-01-01T00:00:00Z', '2026-01-01T00:10:00Z');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).conditions.length, 3);
  response = await h.request('2026-01-01T00:05:00Z', '2026-01-01T00:10:00Z');
  const body = await response.json();
  assert.equal(body.conditions.length, 2);
  assert.equal(body.now, null);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].KeyConditionExpression, 'device_name = :dn and created_unix between :s and :e');
});

test('paging follows LastEvaluatedKey and preserves all observations', async () => {
  const day = Date.parse('2026-01-01T00:00Z');
  const h = harness(Array.from({ length: 700 }, (_, i) => sample(day + i * 60000)));
  const model = h.load('src/lib/models/conditions.ts');
  const result = await model.findConditionByNameAndDateRange('reid', { start_date: new Date(day), end_date: new Date(day + DAY - 1) });
  assert.equal(result.length, 700);
  assert.equal(h.calls.length, 2);
  assert.deepEqual(h.calls[1].ExclusiveStartKey, { index: 500 });
});

test('31 days at firmware frequency reads at most 32 day partitions and returns <=373 points', async () => {
  const start = Date.parse('2026-01-01T12:00Z');
  const rows = Array.from({ length: 31 * 288 + 1 }, (_, i) => sample(start + i * 300000));
  const h = harness(rows);
  const response = await h.request(new Date(start).toISOString(), new Date(start + 31 * DAY).toISOString());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.range.interval_minutes, 120);
  assert.ok(body.conditions.length <= 373);
  assert.equal(h.calls.length, 32);
});

test('read limit returns 422 instead of silently truncating', async () => {
  const day = Date.parse('2026-01-01T00:00Z');
  const h = harness(Array.from({ length: 2001 }, (_, i) => sample(day + i * 1000)));
  const response = await h.request('2026-01-01T00:00:00Z', '2026-01-01T01:00:00Z');
  assert.equal(response.status, 422);
  assert.equal(h.calls.length, 4);
});

test('empty results and nullable latest are valid responses', async () => {
  const h = harness();
  const response = await h.request('2026-01-01T00:00:00Z', '2026-01-01T01:00:00Z', {});
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.conditions, []);
  assert.equal(body.now, null);
  assert.equal(h.calls.length, 2);
});

test('DB failures are 503 and failures are not cached', async t => {
  t.mock.method(console, 'error', () => {});
  const h = harness([], () => { throw new Error('offline'); });
  for (let i = 0; i < 2; i++) {
    const response = await h.request('2026-01-01T00:00:00Z', '2026-01-01T01:00:00Z');
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Retry-After'), '5');
  }
  assert.equal(h.calls.length, 2);
});

test('process cache deduplicates concurrent misses, expires, and bounds distinct work', async t => {
  const { cachedConditionData, HistoryBusyError } = loader()('src/lib/condition-cache.ts');
  let time = 100000;
  t.mock.method(Date, 'now', () => time);
  let count = 0;
  const load = async () => ++count;
  assert.deepEqual(await Promise.all([cachedConditionData('same', 10, load), cachedConditionData('same', 10, load)]), [1, 1]);
  assert.equal(await cachedConditionData('same', 10, load), 1);
  time += 11000;
  assert.equal(await cachedConditionData('same', 10, load), 2);
  let release;
  const wait = new Promise(resolve => { release = resolve; });
  const a = cachedConditionData('a', 10, () => wait);
  const b = cachedConditionData('b', 10, () => wait);
  await assert.rejects(cachedConditionData('c', 10, load), HistoryBusyError);
  release(1);
  await Promise.all([a, b]);
});

test('Redis cache survives separate process module graphs and uses an expiring lock', async t => {
  const oldUrl = process.env.UPSTASH_REDIS_REST_URL;
  const oldToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test';
  t.after(() => {
    if (oldUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL; else process.env.UPSTASH_REDIS_REST_URL = oldUrl;
    if (oldToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN; else process.env.UPSTASH_REDIS_REST_TOKEN = oldToken;
  });
  const values = new Map();
  const commands = [];
  t.mock.method(global, 'fetch', async (_url, init) => {
    const command = JSON.parse(init.body);
    commands.push(command);
    const [op, key, value] = command;
    let result = null;
    if (op === 'GET') result = values.get(key) ?? null;
    if (op === 'SET') {
      if (!command.includes('NX') || !values.has(key)) { values.set(key, value); result = 'OK'; }
    }
    if (op === 'EVAL') { values.delete(command[3]); result = 1; }
    return Response.json({ result });
  });
  let loads = 0;
  const load = async () => ++loads;
  const first = loader()('src/lib/condition-cache.ts');
  const second = loader()('src/lib/condition-cache.ts');
  assert.equal(await first.cachedConditionData('shared', 300, load), 1);
  assert.equal(await second.cachedConditionData('shared', 300, load), 1);
  assert.equal(loads, 1);
  assert.ok(commands.some(command => command[0] === 'SET' && command.includes('NX') && command.includes(45)));
  values.set('busy:lock', 'another-worker');
  await assert.rejects(second.cachedConditionData('busy', 300, load), second.HistoryBusyError);
  assert.equal(loads, 1);
});

test('Redis outage falls back locally and circuit breaker prevents repeated network calls', async t => {
  const oldUrl = process.env.UPSTASH_REDIS_REST_URL;
  const oldToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test';
  t.after(() => {
    if (oldUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL; else process.env.UPSTASH_REDIS_REST_URL = oldUrl;
    if (oldToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN; else process.env.UPSTASH_REDIS_REST_TOKEN = oldToken;
  });
  let requests = 0;
  t.mock.method(console, 'warn', () => {});
  t.mock.method(global, 'fetch', async () => { requests++; throw new Error('offline'); });
  const { cachedConditionData } = loader()('src/lib/condition-cache.ts');
  assert.equal(await cachedConditionData('a', 300, async () => 1), 1);
  assert.equal(await cachedConditionData('b', 300, async () => 2), 2);
  assert.equal(await cachedConditionData('a', 300, async () => 3), 1);
  assert.equal(requests, 1);
});
