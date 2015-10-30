/**
 * Created by aikeru on 10/17/2015.
 */

var fileNamesUpdateTimeout;
var currentImageIndex = 0;
var updateGalleryTimeout;
var galleryData = {
    fileNames: []
};
var imagesSeen = new Set();

var viewportHeight = 768;

function getRandom(min, max) {
    return Math.floor((Math.random() * max) + min);
}

function swapImages() {
    var swapDeferred = $.Deferred();
    //http://jquery-howto.blogspot.com/2009/05/replacing-images-at-time-intervals.html

    var $active = $('#gallery-container img.active');
    var $next = $('#gallery-container img:not(.active)');
    $active.fadeOut(function() {
        $active.removeClass('active');
        $next.fadeIn(function() {
            swapDeferred.resolve();
        }).addClass('active');
    });

    return swapDeferred.promise();
}

function updateFiles() {
    fileNamesUpdateTimeout = window.setTimeout(function() {
        $.ajax({url: "/list-images"})
            .done(function(data) {
                galleryData = data;
                updateFiles();
            })
    }, 1000);
}

var lastImageSeen = '';
function getNextImageIndex() {
    if(!galleryData) { return; }
    if(!galleryData.fileNames) { return; }
    //Find a new image we haven't seen if possible
    for(var i = 0; i < galleryData.fileNames.length; i++) {
        if(!imagesSeen.has(galleryData.fileNames[i])) {
            imagesSeen.add(galleryData.fileNames[i]);
            lastImageSeen = galleryData.fileNames[i];
            return galleryData.fileNames[i];
        }
    }
    var tries = 0,
        found = false,
        retIndex = 0;
    //We've seen all the available images, so just pick one at random
    while(tries < 5 && found === false) {
        retIndex = getRandom(0, galleryData.fileNames.length);
        if(galleryData.fileNames[retIndex] !== undefined
        && galleryData.fileNames[retIndex] !== lastImageSeen) {
            found = true;
            lastImageSeen = galleryData.fileNames[retIndex];
        }
        tries++;
    }
    return retIndex;
}

function updateGalleryImage() {
    console.log('updating image ...');
    //var currentImageIndex = getRandom(0, galleryData.fileNames.length);
    var currentImageIndex = getNextImageIndex();
    if(galleryData.fileNames[currentImageIndex] && galleryData.fileNames[currentImageIndex].toLowerCase().indexOf('ini') > -1) {
        updateGalleryTimeout = window.setTimeout(updateGalleryImage, 100);
    }
    if(galleryData.fileNames[currentImageIndex] === undefined) {
        //Wait another 5 seconds and choose another
       updateGalleryTimeout = window.setTimeout(
           updateGalleryImage, 5000);
    } else {
        var nextImg = $("#gallery-container img:not(.active)");
        nextImg.attr('src', '/image/' + galleryData.fileNames[currentImageIndex]);
        console.log('setting image to ', galleryData.fileNames[currentImageIndex], currentImageIndex);
        swapImages()
            .done(function () {
                updateGalleryTimeout = window.setTimeout(
                    updateGalleryImage,
                    5000);
            });
    }
}

//Start file scan loop
updateFiles();

$(function() {
    viewportHeight = $(window).height() - 65;
    $('#gallery-container').css('height', viewportHeight + 'px');
    $(window).resize(function() {
       viewportHeight = $(window).height() - 65;
        $('#gallery-container').css('height', viewportHeight + 'px');
    });
    $('#image-one').addClass('active');
    //Start gallery loop
    updateGalleryImage();

});