
const remote = require('electron').remote; 
import { Series, DataFrame } from 'pandas-js';

let forceDF;
let deflectionDF;

function createDataFrames(deflectionDataRaw, forceDataRaw) {
  forceDF = new DataFrame(forceDataRaw)
  deflectionDF = new DataFrame(deflectionDataRaw.df)

  console.log(deflectionDF.toString())
  console.log(forceDF.toString())

    var indexes = [], i;
    for(i = 0; i < forceDF.length; i++)
        if (forceDF['Force'][i] <= deflectionDataRaw.forceStartVal)
            indexes.push(i);
    console.log(indexes);
  
}


module.exports = {
  processData: function(deflectionData, forceData) {
    createDataFrames(deflectionData, forceData);
    return;
  }
}