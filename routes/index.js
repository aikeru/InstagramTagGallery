var express = require('express');
var router = express.Router();
var fs = require('fs'),
    path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/list-images', function(req, res, next) {
  //fs.readdir('./gallery/', function(err, files) {
  fs.readdir('c:\\users\\aikeru\\downloads\\', function(err, files) {
    var result = files.filter(function(f) {
      return f.indexOf('jpg') > -1;
    });
    res.json({
      fileNames: files
    });
  });

});

router.get('/image/:fileName', function(req,res,next) {
  //var imageFile = path.join(require('path').dirname(require.main.filename), "..", "gallery", req.params.fileName);
  var imageFile = path.join('c:\\users\\aikeru\\downloads\\' + req.params.fileName);
console.log(imageFile);
  res.sendFile(imageFile);
});

module.exports = router;
