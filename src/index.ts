/* eslint-disable no-console */
import http from 'http';
import { readFileSync } from 'fs';

import { compile } from 'path-to-regexp';
import { MESSAGES, CLOUDFLARE_API } from './constants';

type DNSRecordResponseBody = {
  id: string;
  content: string;
  name: string;
  proxied: boolean;
  proxiable: boolean;
  type: string;
  comment: string;
  created_on: string;
  modified_on: string;
  locked: boolean;
  meta: any;
  tags: string[];
  ttl: number;
  zone_id: string;
  zone_name: string;
};

type DNSRecordRequestBody = {
  content: string;
  name: string;
  proxied: boolean;
  type: string;
  comment: string;
  tags: string[];
  ttl: number;
};

let API_KEY: string;
let ZONE_ID: string;

function loadConfig() {
  try {
    const data = readFileSync('./config.json', 'utf8');
    const config = JSON.parse(data);
    if (!config.API_KEY || !config.ZONE_ID) {
      throw new Error('Config is missing either API_KEY or ZONE_ID');
    }

    API_KEY = config.API_KEY;
    ZONE_ID = config.ZONE_ID;
  } catch (error) {
    console.error(error);
    throw new Error('Could not import or read config.json!');
  }
}

function getUnixTimestamp(): number {
  return Math.round(Date.now() / 1000);
}

/**
 * Attempts to get the external IP address.
 * @return {!Promise.<string>} Resolves with the external IP string.
 */
function getExternalIp(): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get({ host: 'api.ipify.org', port: 80, path: '/' }, (resp) => {
      resp.on('data', (ip) => {
        resolve(ip.toString());
      });

      resp.on('error', reject);
    });
  });
}

/**
 * Fetches all DNS records for the configured Zone ID.
 * @return {Promise.<!Array>} Promise resolving with the DNS record list.
 */
async function fetchRecords(): Promise<DNSRecordResponseBody[]> {
  const compileFn = compile(CLOUDFLARE_API.LIST_RECORDS_PATH, { encode: encodeURIComponent });
  const url = new URL(compileFn({ zoneId: ZONE_ID }), CLOUDFLARE_API.BASE_URL);

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  if (res.ok) {
    const body = await res.json();
    if (body && body.result) return body.result;

    throw new Error(MESSAGES.FETCH_RECORDS_PARSE_ERROR);
  } else {
    throw new Error(MESSAGES.FETCH_RECORDS_UNKNOWN_ERROR);
  }
}

async function updateRecord({
  id,
  name,
  proxied,
  type,
  tags,
}: DNSRecordResponseBody) {
  console.log(MESSAGES.UPDATE_RECORDS_START.replace('%NAME%', name));

  // Get the external IP to use in the DNS update.
  const externalIP = await getExternalIp();

  const updatedRecord: DNSRecordRequestBody = {
    content: externalIP,
    ttl: 1, // A numeric value of "1" sets the TTL to automatic on Cloudflare's side.
    comment: MESSAGES.UPDATE_RECORDS_COMMENT.replace('%TIMESTAMP%', getUnixTimestamp().toString()),
    name,
    proxied,
    type,
    tags,
  };

  const compileFn = compile(CLOUDFLARE_API.UPDATE_RECORDS_PATH, { encode: encodeURIComponent });
  const url = new URL(compileFn({ zoneId: ZONE_ID, dnsRecordId: id }), CLOUDFLARE_API.BASE_URL);

  const res = await fetch(url, {
    method: 'put',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(updatedRecord),
  });

  if (res.ok) {
    console.log(MESSAGES.UPDATE_RECORDS_SUCCESS.replace('%NAME%', name));
    return;
  }

  throw new Error(MESSAGES.UPDATE_RECORDS_UNKOWN_ERROR.replace('%NAME%', name));
}

/**
 * Recursively (and serially) processes each DNS record.
 * @param {!DNSRecordResponseBody} record The record to process.
 * @param {!Array.<!DNSRecordResponseBody>} existingRecords The existing records for this zone.
 */
async function processRecord(
  record: DNSRecordResponseBody,
  existingRecords: DNSRecordResponseBody[],
) {
  await updateRecord(record);
  if (existingRecords.length) {
    const nextRecord = existingRecords.shift() as DNSRecordResponseBody;
    processRecord(nextRecord, existingRecords);
  } else {
    console.log('All records updated!');
  }
}

async function exec() {
  try {
    console.log('Loading config.json...');
    loadConfig();
    console.log('Successfully loaded config.json!');

    console.log('Fetching records...');
    const existingRecords = await fetchRecords();
    console.log(`Finished fetching ${existingRecords.length} record(s).`);

    console.log('Updating records...');
    if (existingRecords && existingRecords.length) {
      const record = existingRecords.shift() as DNSRecordResponseBody;
      processRecord(record, existingRecords);
    } else {
      console.log(MESSAGES.UPDATE_RECORDS_EMPTY_LIST);
    }
  } catch (error) {
    console.error('The script encountered an error:\n\n', error);
  }
}

exec();
