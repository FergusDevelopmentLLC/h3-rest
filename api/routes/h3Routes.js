'use strict';
module.exports = function(app) {

  var h3 = require('../controllers/h3Controller');

  app.route('/h3/:top_left/:bottom_left/:bottom_right/:top_right/:zoom')
    .get(h3.getH3BinsForExtent);

  app.route('/h3/meteor')
    .get(h3.getMeteor);

  app.route('/h3/hexagons/:resolution')
    .get(h3.getGlobeHexagons);


  //https://boundingbox.klokantech.com
  //http://localhost:8670/h3/binsforbb/9/[-109.1950357997,36.944478699],[-101.8608644601,36.944478699],[-101.8608644601,41.0584355368],[-109.1950357997,41.0584355368],[-109.1950357997,36.944478699]
  app.route('/h3/binsforbb/:resolution/:boundingbox')
    .get(h3.getH3BinsForBoundingBox);

};