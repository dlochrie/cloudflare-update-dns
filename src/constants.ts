import packageJSON from '../package.json';

export const MESSAGES = {
  FETCH_RECORDS_UNKNOWN_ERROR: 'Something went wrong during the DNS records fetch. Please check your URL and/or API key and DNS Zone ID.',
  FETCH_RECORDS_PARSE_ERROR: 'Could not parse JSON response for DNS records fetch.',
  UPDATE_RECORDS_START: 'Attempting to update record "%NAME%"...',
  UPDATE_RECORDS_SUCCESS: 'Successfully updated record "%NAME%"!',
  UPDATE_RECORDS_UNKOWN_ERROR: 'Something went wrong with updating DNS record "%NAME%".',
  UPDATE_RECORDS_COMMENT: `Update by ${packageJSON} script on %TIMESTAMP%.`,
  UPDATE_RECORDS_EMPTY_LIST: 'There were no records to update.',
};

export const CLOUDFLARE_API = {
  BASE_URL: 'https://api.cloudflare.com',
  LIST_RECORDS_PATH: '/client/v4/zones/:zoneId/dns_records',
  UPDATE_RECORDS_PATH: '/client/v4/zones/:zoneId/dns_records/:dnsRecordId',
};
