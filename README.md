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

...and place it at the root of this application:

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

Now, you can run `npm start`, or `npx tsc && node .` from the app root.

Or you can install with `npm i cloudflare-update-dns -g`, and then run `cloudflare-update-dns` from
you command line.

If you want to run a cronjob that runs the script at intervals:

```
# Every 5 minutes (change to whatever frequency you prefer).
*/5  * * * * cloudflare-update-dns >> /var/log/cloudflare-update-dns/update.log
```

## Troubleshooting

This script uses the API token, and does not require the email and/or password combination.
Typically, when you create a new API token, it will give you a sample `curl` request. Compare the
token used in that script with the one you use in the configuration for this script.