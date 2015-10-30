/**
 * Created by aikeru on 10/17/2015.
 */

var webdriverio = require('webdriverio');
//TODO: This still doesn't quite work and the first multi-file download request must still be manually allowed
var options = { desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
            prefs: {
                'multiple-automatic-downloads': 1,
                profile: {
                  'default_content_settings': {
                      download: { prompt_for_download: false },
                      'multiple-automatic-downloads': 1
                  }
                },
                'default_content_settings': {
                    'multiple-automatic-downloads': 1,
                    download: {
                        prompt_for_download: false
                    }
                }
            }
        }
    }
};
var client = webdriverio.remote(options);
var fs = require('fs');

var config = require('./config.json');

console.log('Await ready up!');
async function startScanner() {
  try {
     console.log('Await going ...');
     await client.init().url('https://instagram.com');
     await client.waitForVisible('[name="username"');
     await client.setValue('[name="username"]', config.username);
     await client.setValue('[name="password"]', config.password);
     await client.execute(() => {
        jQuery('button:contains(Log in)')[0].click();
     });
      console.log('Clicked log in ...');
      await waitForUrl('https://instagram.com/');
      console.log('Made it to dashboard ...');
      await client.waitForVisible('.-cx-PRIVATE-SearchBox__inactiveSearchQuery', 5000);
      await client.click('.-cx-PRIVATE-SearchBox__inactiveSearchQuery');
      await client.keys('#' + config.tag);
      await sleepPromise(1000);
      await waitForJavaScript(function() {
         return jQuery('.-cx-PRIVATE-Search__resultTitleText').length > 0;
      }, 2500);
      await client.execute(function() {
          jQuery('.-cx-PRIVATE-Search__resultTitleText')[0].click();
      });
        await waitForUrl('https://instagram.com/explore/tags/' + config.tag + '/', 5000);
      console.log('Made it to ' + config.tag + '...');
      await sleepPromise(500);
      console.log('Found the first image');
      scanAndDownloadImages(); //kick off the motherload!

        //Scan again
      //If we don't find any new images we should refresh

     console.log('await done I guess ...');
  }catch(e) {
     console.log(e);
  }
}

async function doRefresh() {
    console.log('We did not find new content. Wait, and then refresh.');
    await sleepPromise(config.waitBetweenRefresh);
    await client.refresh();
    //Not sure if this is needed, but we want a new context I guess
    setTimeout(function() {
        console.log('Starting after refresh ...');
        scanAndDownloadImages();
    }, 1000);
}
async function scanAndDownloadImages() {
    var isImagesVisible = await client.execute(function() {
        return jQuery('img.-cx-PRIVATE-Photo__image').length > 0;
    });
    if(!isImagesVisible.value) {
        //no images visible for this tag ... yet?
        console.log('Do not see images yet.');
        doRefresh();
        return;
    }
        await client.waitForVisible('img.-cx-PRIVATE-Photo__image');
     var photoImgResult = await getPhotos();
        var photoArr = photoImgResult.value;
        console.log('Found', photoArr.length,'photos');
      var downloadedFiles = await getDownloadedFiles(); //just returns filenames, ie: 'desktop.ini'
      var downloadedImages = downloadedFiles.filter((df) => df.endsWith('jpg'));
      console.log('Found', downloadedImages.length,'downloaded files already');
      var missingFiles = photoArr.filter((p) => {
          var imgName = p.substring(p.lastIndexOf('/') + 1);
            return !downloadedImages.includes(imgName);
      });
      console.log('Seems', missingFiles.length, 'are not in our downloaded folder...');
      if(missingFiles.length === 0) {
          doRefresh();
          return;
      }
      //Download the image files that we do not have
      for(var i = 0; i < missingFiles.length; i++) {
          console.log('Going to try and download', missingFiles[i])
          await sleepPromise(2500); //Hopefully we don't look like we're spammy
          await downloadPhoto(missingFiles[i]);
          await sleepPromise(1000); //Hopefully the image downloads this fast ... ha
          console.log('Okay, moving on to the next operation ...');
      }

      //Scroll to the bottom of the page
      await scrollToBottom();
      await sleepPromise(1500);

      var photoImgResult2 = await getPhotos();
      //Are any of the photos now new to us?
      var foundNew = false;
    for(var i = 0; i < photoImgResult2.value.length; i++) {
        var photo2 = photoImgResult2.value[i];
        if(!photoArr.includes(photo2)) {
            //Grab 'em!
            scanAndDownloadImages();
        }
    }
    //No new photos ... load more button?
      var isVisibleResult = await client.execute(function() {
         return jQuery('a:contains(Load more)').length > 0;
      });
      if(!isVisibleResult.value) {
          console.log('There is no load more button. Assuming there are no more images right now.');
          doRefresh();
          return;
      }
      await client.execute(function() {
        jQuery('a:contains(Load more)')[0].click();
      });
      await sleepPromise(1500);
     console.log('Clicked load more, scanning again!');
     scanAndDownloadImages();
}

function scrollToBottom() {
    return client.execute(function() {
        jQuery('html, body').animate({scrollTop: jQuery(document).height()}, 'slow');
    });
}

function sleepPromise(msec) {
    var p = new Promise(function(resolve, reject) {
        setTimeout(() => {
            resolve();
        }, msec);
    });
    return p;
}
function getDownloadedFiles() {
    var p = new Promise(function(resolve, reject) {
        fs.readdir(config.downloadFolder, (err, list) => {
            if(err) { console.error(err); reject(); }
            resolve(list);
        });
    });
    return p;
}
function downloadPhoto(imgSrc) {
    //Check if we've seen this file before

    var funcStr = `
        (function() {
            var downloadLink = "<DownloadLink>";
            var downloadTag = jQuery('<a href="' + downloadLink + '" download>Down</a>');
            downloadTag[0].click();
        })
    `;
    funcStr = funcStr.replace('<DownloadLink>', imgSrc);

    return client.execute(eval(funcStr));
}

function getPhotos() {
    return client.execute(function() {
       var images = [];
        $.each(jQuery('.-cx-PRIVATE-Photo__placeholder img.-cx-PRIVATE-Photo__image'), function() {
          images.push($(this).attr('src'));
        });
        return images;
    });
}

function openFirstPhoto() {
      return client.execute(function() {
        jQuery('img.-cx-PRIVATE-Photo__image')[0].click();
      });
}

startScanner();

function waitForJavaScript(jsFunc, msec) {
   return client.waitUntil(function() {
      return client.execute(jsFunc).then(function(result) { return result.value; });
   }, msec || 1000);
}

function waitForDomReady() {
   waitForJavaScript(function() {
      if (document.readyState === 'complete') {
         return true;
      } else {
         return false;
      }
   });
}

function closeModal() {
   client.execute(function() {
      var elements = document.getElementsByClassName('closeModal');
      if(elements.length) {
         elements[0].click();
      }
   });
}
function waitForUrl(urlStr, msec) {
   return client.waitUntil(function() {
      return client.url().then(function(resp) {
          console.log('Checking if',resp.value,urlStr,'are equal');
         return resp.value === urlStr;
      });
   }, msec || 1000);
}
