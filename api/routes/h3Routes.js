'use strict';
module.exports = function(app) {

  var h3 = require('../controllers/h3Controller');

  app.route('/h3/:top_left/:bottom_left/:bottom_right/:top_right/:zoom')
    .get(h3.getH3BinsForExtent);

  app.route('/h3/meteor')
    .get(h3.getMeteor);

  //https://boundingbox.klokantech.com
  //http://localhost:8670/h3/binsforbb/9/[-109.1950357997,36.944478699],[-101.8608644601,36.944478699],[-101.8608644601,41.0584355368],[-109.1950357997,41.0584355368],[-109.1950357997,36.944478699]
  //continental usa: [-127.1605408192,23.3784089132],[-65.1097595692,23.3784089132],[-65.1097595692,51.6560952393],[-127.1605408192,51.6560952393],[-127.1605408192,23.3784089132]
  //front range: [-105.9074890614,38.0747728023],[-103.940936327,38.0747728023],[-103.940936327,40.8311398231],[-105.9074890614,40.8311398231],[-105.9074890614,38.0747728023]
  app.route('/h3/binsforbb/:resolution/:boundingbox')
    .get(h3.getH3BinsForBoundingBox);

};