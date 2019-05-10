'use strict';
module.exports = function(app) {

  var h3 = require('../controllers/h3Controller');

  app.route('/h3/:top_left/:bottom_left/:bottom_right/:top_right/:zoom')
    .get(h3.getH3BinsForExtent);

  app.route('/h3/meteor')
    .get(h3.getMeteor);

  app.route('/h3/hexagons/:resolution')
    .get(h3.getGlobeHexagons);

};