/* eslint-disable no-console */
import { readFileSync } from 'fs';

import { compile } from 'path-to-regexp';

import { MESSAGES, CLOUDFLARE_API } from './constants.js';

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

type Config = {
  API_KEY: string;
  ZONE_ID: string;
};

function getUnixTimestamp(): number {
  return Math.round(Date.now() / 1000);
}

/**
 * Attempts to get the external IP address.
 * @return {!Promise.<string>} Resolves with the external IP string.
 */
async function getExternalIp(): Promise<string> {
  try {
    // TODO: Provide fallback URLs...
    const res = await fetch('https://icanhazip.com', {
      headers: {
        'Content-Type': 'application/text',
      },
    });
    const ip = await res.text();
    if (ip) return ip;

    throw new Error(MESSAGES.FETCH_IP_PARSE_ERROR);
  } catch (error) {
    console.error(error);
    let message = MESSAGES.FETCH_IP_REQUEST_ERROR;
    if (error instanceof Error) message = error.message;

    // If the error is a parse error, re-throw it, else throw generic error.
    if (message === MESSAGES.FETCH_IP_PARSE_ERROR) throw error;
    throw new Error(MESSAGES.FETCH_IP_REQUEST_ERROR);
  }
}

class CloudflareUpdater {
  ip: string = '';

  apiKey: string = '';

  zoneId: string = '';

  constructor(config: string) {
    if (!config) throw new Error(MESSAGES.ERR_CONFIG_MISSING);

    this.loadConfig(config);
  }

  /**
   * Recursively (and serially) processes each DNS record.
   * @param {!DNSRecordResponseBody} record The record to process.
   * @param {!Array.<!DNSRecordResponseBody>} existingRecords The existing records for this zone.
   */
  async processRecord(
    record: DNSRecordResponseBody,
    existingRecords: DNSRecordResponseBody[],
  ) {
    await this.updateRecord(record);
    if (existingRecords.length) {
      const nextRecord = existingRecords.shift() as DNSRecordResponseBody;
      await this.processRecord(nextRecord, existingRecords);
    } else {
      console.log('All records updated!');
    }
  }

  loadConfig(config: string) {
    try {
      const data = readFileSync(config, 'utf8');
      const { API_KEY: apiKey, ZONE_ID: zoneId }: Config = JSON.parse(data);
      if (!apiKey || !zoneId) {
        throw new Error(MESSAGES.ERR_CONFIG_PARAMS);
      }

      this.apiKey = apiKey;
      this.zoneId = zoneId;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === MESSAGES.ERR_CONFIG_PARAMS) throw error;

      throw new Error(MESSAGES.ERR_CONFIG_READ);
    }
  }

  /**
   * Fetches all DNS records for the configured Zone ID.
   * @return {Promise.<!Array>} Promise resolving with the DNS record list.
   */
  async fetchRecords(): Promise<DNSRecordResponseBody[]> {
    const compileFn = compile(CLOUDFLARE_API.LIST_RECORDS_PATH, { encode: encodeURIComponent });
    const url = new URL(compileFn({ zoneId: this.zoneId }), CLOUDFLARE_API.BASE_URL);

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (res.ok) {
      const body: any = await res.json();
      if (body && body.result) return body.result;

      throw new Error(MESSAGES.FETCH_RECORDS_PARSE_ERROR);
    } else {
      throw new Error(MESSAGES.FETCH_RECORDS_UNKNOWN_ERROR);
    }
  }

  async updateRecord({
    id,
    name,
    proxied,
    type,
    tags,
  }: DNSRecordResponseBody) {
    const { apiKey, zoneId } = this;

    console.log(MESSAGES.UPDATE_RECORDS_START.replace('%NAME%', name));

    // Get the external IP to use in the DNS update.
    const externalIP = this.ip;

    const updatedRecord: DNSRecordRequestBody = {
      content: externalIP,
      ttl: 1, // A numeric value of "1" sets the TTL to automatic on Cloudflare's side.
      comment: MESSAGES.UPDATE_RECORDS_COMMENT.replace(
        '%TIMESTAMP%',
        getUnixTimestamp().toString(),
      ),
      name,
      proxied,
      type,
      tags,
    };

    const compileFn = compile(CLOUDFLARE_API.UPDATE_RECORDS_PATH, { encode: encodeURIComponent });
    const url = new URL(compileFn({ zoneId, dnsRecordId: id }), CLOUDFLARE_API.BASE_URL);

    const res = await fetch(url, {
      method: 'put',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(updatedRecord),
    });

    if (res.ok) {
      console.log(MESSAGES.UPDATE_RECORDS_SUCCESS.replace('%NAME%', name));
      return;
    }

    throw new Error(MESSAGES.UPDATE_RECORDS_UNKOWN_ERROR.replace('%NAME%', name));
  }

  async exec() {
    try {
      console.log('Fetching extenal IP...');
      this.ip = await getExternalIp();
      console.log(`IP found: ${this.ip}`);

      console.log('Fetching records...');
      const existingRecords = await this.fetchRecords();
      console.log(`Finished fetching ${existingRecords.length} record(s).`);

      console.log('Updating records...');
      if (existingRecords && existingRecords.length) {
        const record = existingRecords.shift() as DNSRecordResponseBody;
        await this.processRecord(record, existingRecords);
      } else {
        console.log(MESSAGES.UPDATE_RECORDS_EMPTY_LIST);
      }
    } catch (error) {
      console.error('The script encountered an error:\n\n', error);
    }
  }
}

export default CloudflareUpdater;
