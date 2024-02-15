import packageJSON from '../package.json';

export const MESSAGES = {
  FETCH_RECORDS_UNKNOWN_ERROR: 'Something went wrong during the DNS records fetch. Please check your URL and/or API key and DNS Zone ID.',
  FETCH_RECORDS_PARSE_ERROR: 'Could not parse JSON response for DNS records fetch.',
  UPDATE_RECORDS_START: 'Attempting to update record "%NAME%"...',
  UPDATE_RECORDS_SUCCESS: 'Successfully updated record "%NAME%"!',
  UPDATE_RECORDS_UNKOWN_ERROR: 'Something went wrong with updating DNS record "%NAME%".',
  UPDATE_RECORDS_COMMENT: `Update by ${packageJSON.name} script on %TIMESTAMP%.`,
  UPDATE_RECORDS_EMPTY_LIST: 'There were no records to update.',
  FETCH_IP_PARSE_ERROR: 'There was an error parsing the fetch IP response.',
  FETCH_IP_REQUEST_ERROR: 'There was an error with the fetch IP request.',
  ERR_CONFIG_MISSING: 'Could not find a config file, or the path you provided is invalid. Either create a config.json in the root of this app, or pass the "-c" option to the path to your config.',
  ERR_CONFIG_PARAMS: 'Your config.json is missing either an "API_KEY" or a "ZONE_ID". Please check and try again.',
  ERR_CONFIG_READ: 'Could not import or read config.json! Please check that the path is valid, and the contents is valid JSON.',
};

export const CLOUDFLARE_API = {
  BASE_URL: 'https://api.cloudflare.com',
  LIST_RECORDS_PATH: '/client/v4/zones/:zoneId/dns_records',
  UPDATE_RECORDS_PATH: '/client/v4/zones/:zoneId/dns_records/:dnsRecordId',
};
