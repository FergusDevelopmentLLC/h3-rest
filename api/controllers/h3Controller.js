const geojson2h3 = require('geojson2h3')

// const h3_01_data = require('./data/h3_01_data.json')
// const h3_02_data = require('./data/h3_02_data.json')
// const h3_03_data = require('./data/h3_03_data.json')
// const h3_04_data = require('./data/h3_04_data.json')
// const h3_05_data = require('./data/h3_05_data.json')

const h3_01_data = require('./data/hex3_01_mcdonalds.json')
const h3_02_data = require('./data/hex3_02_mcdonalds.json')
const h3_03_data = require('./data/hex3_03_mcdonalds.json')
const h3_04_data = require('./data/hex3_04_mcdonalds.json')
const h3_05_data = require('./data/hex3_05_mcdonalds.json')
const h3_06_data = require('./data/hex3_06_mcdonalds.json')

exports.getH3BinsForExtent = (req, res) => {

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
  }

  const resolution = getH3ResolutionBasedOnZoom(req.params.zoom)

  const hexagons = geojson2h3.featureToH3Set(polygon, resolution)

  let fc = geojson2h3.h3SetToFeatureCollection(hexagons)

  fc = joinFeatureToData(fc, resolution)

  fc = assignSymbologyClasses(fc)

  fc = assignPentagonClass(fc)

  fc = removeProblemBins(fc)

  res.header("Access-Control-Allow-Origin", "*")

  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")

  res.json(fc)

}

exports.getMeteor = (req, res) => {

  const fs = require('fs')
  
  const meteors = JSON.parse(fs.readFileSync(`${__dirname}/meteor.geojson`))
  
  res.json(meteors)

}

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
      res.json(message)
      console.log(message)
      //res.json(feature)
    }
  })

}

getH3ResolutionBasedOnZoom = (zoom) => {
  
  let res = 1

  let z = parseFloat(zoom)

  //sucks, i know v
  if      (z <  4.0 )             res = 2
  else if (z >= 4.0  && z < 5.5)  res = 3
  else if (z >= 5.5  && z < 7.5)  res = 4
  else if (z >= 7.0  && z < 8.5)  res = 5
  else if (z >= 8.5  && z < 10.0) res = 6
  else if (z >= 10.0 && z < 11.5) res = 7
  else if (z >= 11.5 && z < 13.0) res = 8
  else if (z >= 13.0 && z < 15)   res = 9
  else if (z >= 15.0 && z < 16.0) res = 10
  else if (z >= 16.0 && z < 17.5) res = 11
  else if (z >= 17.5 && z < 19.0) res = 12
  else if (z >= 19.0 && z < 20.5) res = 13
  else if (z >= 20.5 && z < 21.5) res = 14
  else if (z >= 21.5)             res = 15

  return res
}

assignPentagonClass = (featureCollection) => {
  for (let f of featureCollection.features) {
    if (f.geometry.coordinates[0].length == 6) f.properties.class = 'pentagon';
  }
  return featureCollection
}

setCountsForFeatureCollection = (featureCollection, dataSource) => {
  
  let fs = featureCollection.features

  //console.log('fs.length', fs.length)
  //check this... https://stackoverflow.com/questions/19480008/javascript-merging-objects-by-id
  let hash = new Map()
  fs.concat(dataSource).forEach((obj) => {
    hash.set(obj.id, Object.assign(hash.get(obj.id) || {}, obj))
  })
  let populated = Array.from(hash.values())

  //remove those without geometries. better way?
  let binsWithGeom = []
  for(let bin of populated) {

    //copy the count at to the properties level
    if(!bin.properties) bin.properties = {}
    bin.properties.meteor_count = bin.count 
    
    //delete bin.count
    if(bin.count) delete bin.count

    bin.geometry && binsWithGeom.push(bin)
  }
  populated = binsWithGeom

  let tot = 0
  for (let bin of dataSource) {
    tot = tot + bin.count
  }
  
  for(let bin of populated) {
    bin.properties.tot_meteor_count = tot
    bin.properties.pct = bin.properties.meteor_count / bin.properties.tot_meteor_count
  }

}

joinFeatureToData = (featureCollection, res) => {

  if      (res == 1) setCountsForFeatureCollection(featureCollection, h3_01_data)
  else if (res == 2) setCountsForFeatureCollection(featureCollection, h3_02_data)
  else if (res == 3) setCountsForFeatureCollection(featureCollection, h3_03_data)
  else if (res == 4) setCountsForFeatureCollection(featureCollection, h3_04_data)
  else if (res == 5) setCountsForFeatureCollection(featureCollection, h3_05_data)
  else if (res == 6) setCountsForFeatureCollection(featureCollection, h3_06_data)

  return featureCollection
}

assignSymbologyClasses = (featureCollection) => {

  let max_pct = 0

  let min_pct = 0

  for (let f of featureCollection.features) {
    if (f.properties.pct > max_pct) max_pct = f.properties.pct
  }

  //console.log('featureCollection', featureCollection)

  if (featureCollection.features[0].properties.pct) min_pct = featureCollection.features[0].properties.pct

  for (let f of featureCollection.features) {
    
    if (f.properties.pct < min_pct) min_pct = f.properties.pct
  }

  if (max_pct > 0) {

    const break_length = max_pct / 5
    
    for (let f of featureCollection.features) {  
      if      (f.properties.pct == 0)                                                       { f.properties.class = "0" }
      else if (f.properties.pct > 0 && f.properties.pct <= break_length)                    { f.properties.class = "1" }
      else if (f.properties.pct > break_length && f.properties.pct <= break_length * 2)     { f.properties.class = "2" }
      else if (f.properties.pct > break_length * 2 && f.properties.pct <= break_length * 3) { f.properties.class = "3" }
      else if (f.properties.pct > break_length * 3 && f.properties.pct <= break_length * 4) { f.properties.class = "4" }
      else if (f.properties.pct > break_length * 4 && f.properties.pct <= break_length * 5) { f.properties.class = "5" }
    }
  
  }

  return featureCollection;
}

removeProblemBins = (featureCollection) => {
  
  const badbins = [];

  badbins.push('82226ffffffffff')
  badbins.push('820d97fffffffff')
  badbins.push('82236ffffffffff')
  badbins.push('827fa7fffffffff')
  badbins.push('82166ffffffffff')
  badbins.push('82224ffffffffff')
  badbins.push('820447fffffffff')
  badbins.push('82176ffffffffff')
  badbins.push('82234ffffffffff')
  badbins.push('827f87fffffffff')
  badbins.push('82164ffffffffff')
  badbins.push('822267fffffffff')
  badbins.push('82174ffffffffff')
  badbins.push('82045ffffffffff')
  badbins.push('8247b7fffffffff')
  badbins.push('8233a7fffffffff')
  badbins.push('829a67fffffffff')
  badbins.push('825ba7fffffffff')
  badbins.push('827f9ffffffffff')
  badbins.push('821667fffffffff')
  badbins.push('822247fffffffff')
  badbins.push('824797fffffffff')
  badbins.push('82bac7fffffffff')
  badbins.push('829b67fffffffff')
  badbins.push('823387fffffffff')
  badbins.push('827eb7fffffffff')
  badbins.push('8271b7fffffffff')
  badbins.push('829a47fffffffff')
  badbins.push('825b87fffffffff')
  badbins.push('829b47fffffffff')
  badbins.push('82225ffffffffff')
  badbins.push('827e97fffffffff')
  badbins.push('820d87fffffffff')
  badbins.push('827197fffffffff')
  badbins.push('82badffffffffff')
  badbins.push('82339ffffffffff')
  badbins.push('829a5ffffffffff')
  badbins.push('825b9ffffffffff')
  badbins.push('82165ffffffffff')
  badbins.push('8232b7fffffffff')
  badbins.push('829b5ffffffffff')
  badbins.push('825ab7fffffffff')
  badbins.push('820d9ffffffffff')
  badbins.push('823297fffffffff')
  badbins.push('820cb7fffffffff')
  badbins.push('825a97fffffffff')
  badbins.push('820db7fffffffff')
  badbins.push('820c97fffffffff')
  badbins.push('82f337fffffffff')
  badbins.push('82ed6ffffffffff')
  badbins.push('82bae7fffffffff')
  badbins.push('82eaaffffffffff')
  badbins.push('82ba37fffffffff')
  badbins.push('82eaf7fffffffff')
  badbins.push('82ba27fffffffff')
  badbins.push('82f317fffffffff')
  badbins.push('82bb1ffffffffff')
  badbins.push('82ea8ffffffffff')
  badbins.push('82f3a7fffffffff')
  badbins.push('82ead7fffffffff')
  badbins.push('82ba07fffffffff')
  badbins.push('82eac7fffffffff')
  badbins.push('82db27fffffffff')
  badbins.push('82f387fffffffff')
  badbins.push('82eab7fffffffff')
  badbins.push('82ed67fffffffff')
  badbins.push('82db17fffffffff')
  badbins.push('82bb37fffffffff')
  badbins.push('82db07fffffffff')
  badbins.push('82ba1ffffffffff')
  badbins.push('82f2b7fffffffff')
  badbins.push('82dba7fffffffff')
  badbins.push('82f3affffffffff')
  badbins.push('82eadffffffffff')
  badbins.push('82ea87fffffffff')
  badbins.push('82db97fffffffff')
  badbins.push('82bb07fffffffff')
  badbins.push('82f39ffffffffff')
  badbins.push('82eacffffffffff')
  badbins.push('82db87fffffffff')
  badbins.push('82baf7fffffffff')
  badbins.push('82f38ffffffffff')

  const editedFeatures = [];

  for (let f of featureCollection.features) {
    
    let addit = true

    for (let bin of badbins) {
      if (bin == f.id) addit = false
    }
    
    if (addit) editedFeatures.push(f)
  }

  featureCollection.features = editedFeatures

  return featureCollection
}

