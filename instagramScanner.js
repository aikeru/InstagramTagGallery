/**
 * Created by aikeru on 10/17/2015.
 */

'use strict';

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
function startScanner() {
    return regeneratorRuntime.async(function startScanner$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                context$1$0.prev = 0;

                console.log('Await going ...');
                context$1$0.next = 4;
                return regeneratorRuntime.awrap(client.init().url('https://instagram.com'));

            case 4:
                context$1$0.next = 6;
                return regeneratorRuntime.awrap(client.waitForVisible('[name="username"'));

            case 6:
                context$1$0.next = 8;
                return regeneratorRuntime.awrap(client.setValue('[name="username"]', config.username));

            case 8:
                context$1$0.next = 10;
                return regeneratorRuntime.awrap(client.setValue('[name="password"]', config.password));

            case 10:
                context$1$0.next = 12;
                return regeneratorRuntime.awrap(client.execute(function () {
                    jQuery('button:contains(Log in)')[0].click();
                }));

            case 12:
                console.log('Clicked log in ...');
                context$1$0.next = 15;
                return regeneratorRuntime.awrap(waitForUrl('https://instagram.com/'));

            case 15:
                console.log('Made it to dashboard ...');
                context$1$0.next = 18;
                return regeneratorRuntime.awrap(client.waitForVisible('.-cx-PRIVATE-SearchBox__inactiveSearchQuery', 5000));

            case 18:
                context$1$0.next = 20;
                return regeneratorRuntime.awrap(client.click('.-cx-PRIVATE-SearchBox__inactiveSearchQuery'));

            case 20:
                context$1$0.next = 22;
                return regeneratorRuntime.awrap(client.keys('#' + config.tag));

            case 22:
                context$1$0.next = 24;
                return regeneratorRuntime.awrap(sleepPromise(1000));

            case 24:
                context$1$0.next = 26;
                return regeneratorRuntime.awrap(waitForJavaScript(function () {
                    return jQuery('.-cx-PRIVATE-Search__resultTitleText').length > 0;
                }, 2500));

            case 26:
                context$1$0.next = 28;
                return regeneratorRuntime.awrap(client.execute(function () {
                    jQuery('.-cx-PRIVATE-Search__resultTitleText')[0].click();
                }));

            case 28:
                context$1$0.next = 30;
                return regeneratorRuntime.awrap(waitForUrl('https://instagram.com/explore/tags/' + config.tag + '/', 5000));

            case 30:
                console.log('Made it to ' + config.tag + '...');
                context$1$0.next = 33;
                return regeneratorRuntime.awrap(sleepPromise(500));

            case 33:
                console.log('Found the first image');
                scanAndDownloadImages(); //kick off the motherload!

                //Scan again
                //If we don't find any new images we should refresh

                console.log('await done I guess ...');
                context$1$0.next = 41;
                break;

            case 38:
                context$1$0.prev = 38;
                context$1$0.t0 = context$1$0['catch'](0);

                console.log(context$1$0.t0);

            case 41:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this, [[0, 38]]);
}

function doRefresh() {
    return regeneratorRuntime.async(function doRefresh$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                console.log('We did not find new content. Wait, and then refresh.');
                context$1$0.next = 3;
                return regeneratorRuntime.awrap(sleepPromise(config.waitBetweenRefresh));

            case 3:
                context$1$0.next = 5;
                return regeneratorRuntime.awrap(client.refresh());

            case 5:
                //Not sure if this is needed, but we want a new context I guess
                setTimeout(function () {
                    console.log('Starting after refresh ...');
                    scanAndDownloadImages();
                }, 1000);

            case 6:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this);
}
function scanAndDownloadImages() {
    var isImagesVisible, photoImgResult, photoArr, downloadedFiles, downloadedImages, missingFiles, i, photoImgResult2, foundNew, photo2, isVisibleResult;
    return regeneratorRuntime.async(function scanAndDownloadImages$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                context$1$0.next = 2;
                return regeneratorRuntime.awrap(client.execute(function () {
                    return jQuery('img.-cx-PRIVATE-Photo__image').length > 0;
                }));

            case 2:
                isImagesVisible = context$1$0.sent;

                if (isImagesVisible.value) {
                    context$1$0.next = 7;
                    break;
                }

                //no images visible for this tag ... yet?
                console.log('Do not see images yet.');
                doRefresh();
                return context$1$0.abrupt('return');

            case 7:
                context$1$0.next = 9;
                return regeneratorRuntime.awrap(client.waitForVisible('img.-cx-PRIVATE-Photo__image'));

            case 9:
                context$1$0.next = 11;
                return regeneratorRuntime.awrap(getPhotos());

            case 11:
                photoImgResult = context$1$0.sent;
                photoArr = photoImgResult.value;

                console.log('Found', photoArr.length, 'photos');
                context$1$0.next = 16;
                return regeneratorRuntime.awrap(getDownloadedFiles());

            case 16:
                downloadedFiles = context$1$0.sent;
                downloadedImages = downloadedFiles.filter(function (df) {
                    return df.endsWith('jpg');
                });

                console.log('Found', downloadedImages.length, 'downloaded files already');
                missingFiles = photoArr.filter(function (p) {
                    var imgName = p.substring(p.lastIndexOf('/') + 1);
                    return !downloadedImages.includes(imgName);
                });

                console.log('Seems', missingFiles.length, 'are not in our downloaded folder...');

                if (!(missingFiles.length === 0)) {
                    context$1$0.next = 24;
                    break;
                }

                doRefresh();
                return context$1$0.abrupt('return');

            case 24:
                i = 0;

            case 25:
                if (!(i < missingFiles.length)) {
                    context$1$0.next = 37;
                    break;
                }

                console.log('Going to try and download', missingFiles[i]);
                context$1$0.next = 29;
                return regeneratorRuntime.awrap(sleepPromise(2500));

            case 29:
                context$1$0.next = 31;
                return regeneratorRuntime.awrap(downloadPhoto(missingFiles[i]));

            case 31:
                context$1$0.next = 33;
                return regeneratorRuntime.awrap(sleepPromise(1000));

            case 33:
                //Hopefully the image downloads this fast ... ha
                console.log('Okay, moving on to the next operation ...');

            case 34:
                i++;
                context$1$0.next = 25;
                break;

            case 37:
                context$1$0.next = 39;
                return regeneratorRuntime.awrap(scrollToBottom());

            case 39:
                context$1$0.next = 41;
                return regeneratorRuntime.awrap(sleepPromise(1500));

            case 41:
                context$1$0.next = 43;
                return regeneratorRuntime.awrap(getPhotos());

            case 43:
                photoImgResult2 = context$1$0.sent;
                foundNew = false;

                for (i = 0; i < photoImgResult2.value.length; i++) {
                    photo2 = photoImgResult2.value[i];

                    if (!photoArr.includes(photo2)) {
                        //Grab 'em!
                        scanAndDownloadImages();
                    }
                }
                //No new photos ... load more button?
                context$1$0.next = 48;
                return regeneratorRuntime.awrap(client.execute(function () {
                    return jQuery('a:contains(Load more)').length > 0;
                }));

            case 48:
                isVisibleResult = context$1$0.sent;

                if (isVisibleResult.value) {
                    context$1$0.next = 53;
                    break;
                }

                console.log('There is no load more button. Assuming there are no more images right now.');
                doRefresh();
                return context$1$0.abrupt('return');

            case 53:
                context$1$0.next = 55;
                return regeneratorRuntime.awrap(client.execute(function () {
                    jQuery('a:contains(Load more)')[0].click();
                }));

            case 55:
                context$1$0.next = 57;
                return regeneratorRuntime.awrap(sleepPromise(1500));

            case 57:
                console.log('Clicked load more, scanning again!');
                scanAndDownloadImages();

            case 59:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this);
}

function scrollToBottom() {
    return client.execute(function () {
        jQuery('html, body').animate({ scrollTop: jQuery(document).height() }, 'slow');
    });
}

function sleepPromise(msec) {
    var p = new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        }, msec);
    });
    return p;
}
function getDownloadedFiles() {
    var p = new Promise(function (resolve, reject) {
        fs.readdir(config.downloadFolder, function (err, list) {
            if (err) {
                console.error(err);reject();
            }
            resolve(list);
        });
    });
    return p;
}
function downloadPhoto(imgSrc) {
    //Check if we've seen this file before

    var funcStr = '\n        (function() {\n            var downloadLink = "<DownloadLink>";\n            var downloadTag = jQuery(\'<a href="\' + downloadLink + \'" download>Down</a>\');\n            downloadTag[0].click();\n        })\n    ';
    funcStr = funcStr.replace('<DownloadLink>', imgSrc);

    return client.execute(eval(funcStr));
}

function getPhotos() {
    return client.execute(function () {
        var images = [];
        $.each(jQuery('.-cx-PRIVATE-Photo__placeholder img.-cx-PRIVATE-Photo__image'), function () {
            images.push($(this).attr('src'));
        });
        return images;
    });
}

function openFirstPhoto() {
    return client.execute(function () {
        jQuery('img.-cx-PRIVATE-Photo__image')[0].click();
    });
}

startScanner();

function waitForJavaScript(jsFunc, msec) {
    return client.waitUntil(function () {
        return client.execute(jsFunc).then(function (result) {
            return result.value;
        });
    }, msec || 1000);
}

function waitForDomReady() {
    waitForJavaScript(function () {
        if (document.readyState === 'complete') {
            return true;
        } else {
            return false;
        }
    });
}

function closeModal() {
    client.execute(function () {
        var elements = document.getElementsByClassName('closeModal');
        if (elements.length) {
            elements[0].click();
        }
    });
}
function waitForUrl(urlStr, msec) {
    return client.waitUntil(function () {
        return client.url().then(function (resp) {
            console.log('Checking if', resp.value, urlStr, 'are equal');
            return resp.value === urlStr;
        });
    }, msec || 1000);
}
//just returns filenames, ie: 'desktop.ini'

//Download the image files that we do not have
//Hopefully we don't look like we're spammy

//Scroll to the bottom of the page

//Are any of the photos now new to us?

//# sourceMappingURL=instagramScanner.js.map