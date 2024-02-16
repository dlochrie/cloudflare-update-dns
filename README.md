# Cloudflare Dynamic DNS Update Client

The Cloudflare API is pretty handy for updating DNS clients, so I wrote a little wrapper around
fetching all my known hosts, and updating the external IP for each of them.

This script is based on the List and Fetch APIs:

 - [List DNS Record](https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records)
 - [Update DNS Records](https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-update-dns-record)

Feel free to fork or contribute.

## Usage

You will need:

1. An API Key
  - Go to the `Overview` page for your domain in Cloudflare, and to get `Get your API Token`.
  - You can create a new API Token, make sure it has `DNS.Read` and `DNS.Edit` permissions for `All zones` in `Zone Resources`.
2. The Zone ID for the Zone you want to update
   - Go to the `Overview` page for your domain in Cloudflare, and you should see a section for `API`. You can find the `Zone ID` there.

Create a JSON file called `config.json` with the following contents:

```json
{
  "API_KEY": "<my api key>",
  "ZONE_ID": "<my zone id>"
}
```

Now, you can run:

```bash
# Easiest: If you have Node.js and npx installed:
npx cloudflare-update-dns -c /path/to/my/config.json

# Or: If you have Node.js and want to install as a bin:
npm i cloudflare-update-dns -g # This will make "cloudflare-update-dns" available system-wide.
cloudflare-update-dns -c /path/to/my/config.json
```

The command will output:

```
$ cloudflare-update-dns
Loading config.json...
Successfully loaded config.json!
Fetching records...
Finished fetching 4 record(s).
Updating records...
Attempting to update record "myamazingwebsite.net"...
Successfully updated record "myamazingwebsite.net"!
Attempting to update record "stuff.myamazingwebsite.net"...
Successfully updated record "stuff.myamazingwebsite.net"!
Attempting to update record "things.myamazingwebsite.net"...
Successfully updated record "things.myamazingwebsite.net"!
Attempting to update record "www.myamazingwebsite.net"...
Successfully updated record "www.myamazingwebsite.net"!
All records updated
```

If you want to run a cronjob that runs the script at intervals:

```
# Every 5 minutes (change to whatever frequency you prefer).
*/5  * * * * cloudflare-update-dns >> /var/log/cloudflare-update-dns/update.log
```

## Dev

Create a JSON file called `config.json` with the following contents:

```json
{
  "API_KEY": "<my api key>",
  "ZONE_ID": "<my zone id>"
}
```

And put in the root of this application:

```
/
  buid/
  src/
  ...
  config.json <-- Here
  ...
  package-lock.json
  package.json
  ...
```

Now, you can run `npm run build && ./bin/cloudflare-update-dns.js -c config.json` from the app root.

## Troubleshooting

This script uses the API token, and does not require the email and/or password combination.
Typically, when you create a new API token, it will give you a sample `curl` request. Compare the
token used in that script with the one you use in the configuration for this script.