# Instagram Live Tag Gallery

Proof of concept "live" instagram tag gallery refresh.

```
{
  "username": "<instagram username>",
  "password": "<instagram password>",
  "tag": "<tag to watch>",
  "waitBetweenRefresh": 15000,
  "downloadFolder": "<download folder for chrome>"
}
```
## Dependencies and Environment
* Requires a config.json in root populated as above
* node v0.12.7 (probably requires this or above)
* Chrome 46.0.2490.71 m (may not work in any other browser)
* Selenium Server 2.48.2
* ChromeDriver 2.20.353145
* Java 1.8.0_60-b27 64-bit

## How to execute
* Run Selenium Server locally, pass location of ChromeDriver as argument
* Run node app (ie: node ./bin/www, since the "www" script is the entry point of express), should start instagram
* Open localhost:3000 and wait for images to start loading
* If selenium tries to download multiple images the first time you will need to press allow. This can be fixed but not sure which option webdriverio + Chrome needs.