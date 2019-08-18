const geojson2h3 = require('geojson2h3');
const h3_01_data = require('./data/h3_01_data.json');
const h3_02_data = require('./data/h3_02_data.json');
const h3_03_data = require('./data/h3_03_data.json');
const h3_04_data = require('./data/h3_04_data.json');
const h3_05_data = require('./data/h3_05_data.json');

exports.getH3BinsForExtent = function (req, res) {

  const resolution = getH3ResolutionBasedOn(req.params.zoom);

  const polygon = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        req.params.top_left.split(',').map(Number),
        req.params.bottom_left.split(',').map(Number),
        req.params.bottom_right.split(',').map(Number),
        req.params.top_right.split(',').map(Number),
        req.params.top_left.split(',').map(Number)
      ]]
    }
  };

  const hexagons = geojson2h3.featureToH3Set(polygon, resolution);

  let feature = geojson2h3.h3SetToFeatureCollection(hexagons);

  feature = joinFeatureToData(feature, resolution);

  feature = assignClasses(feature);

  feature = assignIsPentagonClassTo(feature);

  feature = removeProblemBins(feature);

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  res.json(feature);
};

exports.getMeteor = (req, res) => {
  const fs = require('fs');
  const meteors = JSON.parse(fs.readFileSync(`${__dirname}/meteor.geojson`))
  res.json(meteors);
};

exports.getH3BinsForBoundingBox = (req, res) => {

  let boundingBox = req.params.boundingbox

  boundingBox = boundingBox.replace(/\],\[/g, '|')
  boundingBox = boundingBox.replace(/\[/g, '')
  boundingBox = boundingBox.replace(/\]/g, '')

  let bbArray = boundingBox.split('|')
  
  bbArrayFinal = []

  for (let point of bbArray) {
    let pointArray = point.split(',').map(Number)
    bbArrayFinal.push(pointArray)
  }

  const polygon = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: bbArrayFinal
    }
  }

  let resolution = parseInt(req.params.resolution)
  const hexagons = geojson2h3.featureToH3Set(polygon, resolution)
  const feature = geojson2h3.h3SetToFeatureCollection(hexagons)

  // why?
  // for (let f of feature.features) {
  //   f.properties.id = f.id
  // }

  const outputFilename = `${__dirname}/h3bins/${resolution}.geojson`

  const fs = require('fs')
  fs.appendFile(outputFilename, JSON.stringify(feature), (err) => {
    if (err) {
      res.json(err)
      console.log(err)
    }
    else {
      const message = "The geojson file was saved!"
      res.json(message);
      console.log(message);
      //res.json(feature);
    }
  })

}

getH3ResolutionBasedOn = (zoom) => {
  
  let res = 1

  let z = parseFloat(zoom)

  if      (z < 4.5)               res = 2
  else if (z >= 4.5  && z < 6)    res = 3
  else if (z >= 6    && z < 7.5)  res = 4
  else if (z >= 7.5  && z < 9)    res = 5
  else if (z >= 9    && z < 10.5) res = 6
  else if (z >= 10.5 && z < 12)   res = 7
  else if (z >= 12   && z < 13.5) res = 8
  else if (z >= 13.5 && z < 15)   res = 9
  else if (z >= 15   && z < 16.5) res = 10
  else if (z >= 16.5 && z < 18)   res = 11
  else if (z >= 18   && z < 19.5) res = 12
  else if (z >= 19.5 && z < 21)   res = 13
  else if (z >= 21   && z < 22.5) res = 14
  else if (z >= 22.5)             res = 15

  return res
}

assignIsPentagonClassTo = (feature) => {
  for (let i = 0; i < feature.features.length; i++) {
    feature.features[i].properties.id = feature.features[i].id;
    if (feature.features[i].geometry.coordinates[0].length == 6) {
      feature.features[i].properties.class = 'pentagon';
    }
  }
  return feature;
}

joinFeatureToData = (feature, resolution) => {

  for (let i = 0; i < feature.features.length; i++) {

    feature.features[i].properties.meteor_count = 0;

    if (resolution == 1) {

      let tot = 0;
      for (let ii = 0; ii < h3_01_data.length; ii++) {
        if (h3_01_data[ii].id == feature.features[i].id) {
          feature.features[i].properties.meteor_count = h3_01_data[ii].count;
        }
        tot = tot + h3_01_data[ii].count;
      }
      feature.features[i].properties.tot_meteor_count = tot;
      feature.features[i].properties.pct = feature.features[i].properties.meteor_count / feature.features[i].properties.tot_meteor_count;
    }
    else if (resolution == 2) {
      let tot = 0;
      for (let ii = 0; ii < h3_02_data.length; ii++) {
        if (h3_02_data[ii].id == feature.features[i].id) {
          feature.features[i].properties.meteor_count = h3_02_data[ii].count;
        }
        tot = tot + h3_02_data[ii].count;
      }
      feature.features[i].properties.tot_meteor_count = tot;
      feature.features[i].properties.pct = feature.features[i].properties.meteor_count / feature.features[i].properties.tot_meteor_count;
    }
    else if (resolution == 3) {
      let tot = 0;
      for (let ii = 0; ii < h3_03_data.length; ii++) {
        if (h3_03_data[ii].id == feature.features[i].id) {
          feature.features[i].properties.meteor_count = h3_03_data[ii].count;
        }
        tot = tot + h3_03_data[ii].count;
      }
      feature.features[i].properties.tot_meteor_count = tot;
      feature.features[i].properties.pct = feature.features[i].properties.meteor_count / feature.features[i].properties.tot_meteor_count;
    }
    else if (resolution == 4) {
      let tot = 0;
      for (let ii = 0; ii < h3_04_data.length; ii++) {
        if (h3_04_data[ii].id == feature.features[i].id) {
          feature.features[i].properties.meteor_count = h3_04_data[ii].count;
        }
        tot = tot + h3_04_data[ii].count;
      }
      feature.features[i].properties.tot_meteor_count = tot;
      feature.features[i].properties.pct = feature.features[i].properties.meteor_count / feature.features[i].properties.tot_meteor_count;
    }
    else if (resolution == 5) {
      let tot = 0;
      for (let ii = 0; ii < h3_05_data.length; ii++) {
        if (h3_05_data[ii].id == feature.features[i].id) {
          feature.features[i].properties.meteor_count = h3_05_data[ii].count;
        }
        tot = tot + h3_05_data[ii].count;
      }
      feature.features[i].properties.tot_meteor_count = tot;
      feature.features[i].properties.pct = feature.features[i].properties.meteor_count / feature.features[i].properties.tot_meteor_count;
    }
  }
  return feature;
}

assignClasses = (feature) => {

  let max_pct = 0;

  for (let i = 0; i < feature.features.length; i++) {
    if (feature.features[i].properties.pct > max_pct) {
      max_pct = feature.features[i].properties.pct;
    }
  }

  let min_pct = 0;

  if (feature.features[0].properties.pct) {
    min_pct = feature.features[0].properties.pct;
  }

  for (let i = 0; i < feature.features.length; i++) {
    if (feature.features[i].properties.pct < min_pct) {
      min_pct = feature.features[i].properties.pct;
    }
  }

  if (max_pct > 0) {
    const break_length = max_pct / 5;
    for (let i = 0; i < feature.features.length; i++) {
      if (feature.features[i].properties.pct == 0) {
        feature.features[i].properties.class = "0";
      }
      else if (feature.features[i].properties.pct > 0 && feature.features[i].properties.pct <= break_length) {
        feature.features[i].properties.class = "1";
      }
      else if (feature.features[i].properties.pct > break_length && feature.features[i].properties.pct <= break_length * 2) {
        feature.features[i].properties.class = "2";
      }
      else if (feature.features[i].properties.pct > break_length * 2 && feature.features[i].properties.pct <= break_length * 3) {
        feature.features[i].properties.class = "3";
      }
      else if (feature.features[i].properties.pct > break_length * 3 && feature.features[i].properties.pct <= break_length * 4) {
        feature.features[i].properties.class = "4";
      }
      else if (feature.features[i].properties.pct > break_length * 4 && feature.features[i].properties.pct <= break_length * 5) {
        feature.features[i].properties.class = "5";
      }
    }
  }

  return feature;
}

removeProblemBins = (feature) => {
  const badbins = [];
  badbins.push('82226ffffffffff');
  badbins.push('820d97fffffffff');
  badbins.push('82236ffffffffff');
  badbins.push('827fa7fffffffff');
  badbins.push('82166ffffffffff');
  badbins.push('82224ffffffffff');
  badbins.push('820447fffffffff');
  badbins.push('82176ffffffffff');
  badbins.push('82234ffffffffff');
  badbins.push('827f87fffffffff');
  badbins.push('82164ffffffffff');
  badbins.push('822267fffffffff');
  badbins.push('82174ffffffffff');
  badbins.push('82045ffffffffff');
  badbins.push('8247b7fffffffff');
  badbins.push('8233a7fffffffff');
  badbins.push('829a67fffffffff');
  badbins.push('825ba7fffffffff');
  badbins.push('827f9ffffffffff');
  badbins.push('821667fffffffff');
  badbins.push('822247fffffffff');
  badbins.push('824797fffffffff');
  badbins.push('82bac7fffffffff');
  badbins.push('829b67fffffffff');
  badbins.push('823387fffffffff');
  badbins.push('827eb7fffffffff');
  badbins.push('8271b7fffffffff');
  badbins.push('829a47fffffffff');
  badbins.push('825b87fffffffff');
  badbins.push('829b47fffffffff');
  badbins.push('82225ffffffffff');
  badbins.push('827e97fffffffff');
  badbins.push('820d87fffffffff');
  badbins.push('827197fffffffff');
  badbins.push('82badffffffffff');
  badbins.push('82339ffffffffff');
  badbins.push('829a5ffffffffff');
  badbins.push('825b9ffffffffff');
  badbins.push('82165ffffffffff');
  badbins.push('8232b7fffffffff');
  badbins.push('829b5ffffffffff');
  badbins.push('825ab7fffffffff');
  badbins.push('820d9ffffffffff');
  badbins.push('823297fffffffff');
  badbins.push('820cb7fffffffff');
  badbins.push('825a97fffffffff');
  badbins.push('820db7fffffffff');
  badbins.push('820c97fffffffff');
  badbins.push('82f337fffffffff');
  badbins.push('82ed6ffffffffff');
  badbins.push('82bae7fffffffff');
  badbins.push('82eaaffffffffff');
  badbins.push('82ba37fffffffff');
  badbins.push('82eaf7fffffffff');
  badbins.push('82ba27fffffffff');
  badbins.push('82f317fffffffff');
  badbins.push('82bb1ffffffffff');
  badbins.push('82ea8ffffffffff');
  badbins.push('82f3a7fffffffff');
  badbins.push('82ead7fffffffff');
  badbins.push('82ba07fffffffff');
  badbins.push('82eac7fffffffff');
  badbins.push('82db27fffffffff');
  badbins.push('82f387fffffffff');
  badbins.push('82eab7fffffffff');
  badbins.push('82ed67fffffffff');
  badbins.push('82db17fffffffff');
  badbins.push('82bb37fffffffff');
  badbins.push('82db07fffffffff');
  badbins.push('82ba1ffffffffff');
  badbins.push('82f2b7fffffffff');
  badbins.push('82dba7fffffffff');
  badbins.push('82f3affffffffff');
  badbins.push('82eadffffffffff');
  badbins.push('82ea87fffffffff');
  badbins.push('82db97fffffffff');
  badbins.push('82bb07fffffffff');
  badbins.push('82f39ffffffffff');
  badbins.push('82eacffffffffff');
  badbins.push('82db87fffffffff');
  badbins.push('82baf7fffffffff');
  badbins.push('82f38ffffffffff');

  const editedFeatures = [];
  for (let i = 0; i < feature.features.length; i++) {
    let addit = true;
    for (let ii = 0; ii < badbins.length; ii++) {
      if (badbins[ii] == feature.features[i].id) {
        addit = false;
      }
    }
    if (addit) {
      editedFeatures.push(feature.features[i]);
    }
  }
  feature.features = editedFeatures;

  return feature;
}

