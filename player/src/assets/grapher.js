import Chart from 'chart.js';

const $ = require('jquery');
const ipc = require('electron').ipcRenderer;
const remote = require('electron').remote; 
const path = require('path')
const fs = require('fs-extra')
const app = remote.app;
const Datastore = require('nedb');
const db = new Datastore({ filename: path.join(app.getPath('userData'), 'main.db'), autoload: true, timestampData: true  });

var domtoimage = require('dom-to-image')
var XLSX = require('xlsx')
var FileSaver = require('file-saver');

var scatterChart

var graphData = []
var chartDataSets = []
var color=["#ff6384","#5959e6","#2babab","#8c4d15","#8bc34a","#607d8b","#009688"];
var datasets = [];

var ctx = document.getElementById("dataChart");

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
    document.getElementById("min-btn").addEventListener("click", function (e) {
      const window = remote.getCurrentWindow();
      window.minimize(); 
    });
    
    document.getElementById("max-btn").addEventListener("click", function (e) {
      const window = remote.getCurrentWindow();
      if (!window.isMaximized()) {
        window.maximize();
      } else {
        window.unmaximize();
      }	 
    });
    
    document.getElementById("close-btn").addEventListener("click", function (e) {
      scatterChart.destroy()
      const window = remote.getCurrentWindow();
      window.close();
    }); 
    document.getElementById("close-grapher").addEventListener("click", function (e) {
      scatterChart.destroy()
      const window = remote.getCurrentWindow();
      window.close();
    }); 
    document.getElementById("export-graph").addEventListener("click", function (e) {
      ipc.send('open-save-dialog', {type:'graph', name: graphData[0].name + '.jpeg'});
    }); 
    document.getElementById("export-data").addEventListener("click", function (e) {
      ipc.send('open-save-dialog', {type:'data', name: graphData[0].name + '.xlsx'});
    }); 
    ipc.send('grapher-ready');

  }
}

ipc.on('data-ids', function (event, data) {
  console.dir(data);
  getData(data)
 
});
ipc.on('save-selected', function (event, data) {
  console.dir(data);
  if(data.type == "graph"){
    //save image
    domtoimage.toJpeg(document.getElementById('graph-holder'))
    .then(function (dataURL) {
      console.log(dataURL)
      var base64Data = dataURL.replace(/^data:image\/jpeg;base64,/, "");

      fs.writeFile(data.filename, base64Data, 'base64', function(err) {
        console.log(err);
      });

        //FileSaver.saveAs(blob, data.filename);
    });
  } else {
    //create workbook and save
    var wb = XLSX.utils.book_new();
    graphData.forEach(function(docData, i){
      var ws = XLSX.utils.aoa_to_sheet(docData.data);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet " + i);
    })
        
    var buf = XLSX.write(wb, {type:'buffer', bookType: "xlsx"});
    fs.writeFile(data.filename, buf, function(err) {
      if(err) {
          return console.log(err);
      }
  
      console.log("The file was saved!");
    }); 
  }
 
});

function getData(data){
  db.find({_id: { $in: data}}).exec(function(err, docs) {  
    docs.forEach(function(d) {
        graphData.push(d)
    });
    processData()
  });
}

function processData(data){
  graphData.forEach(function(docData){
    var tmpData = docData.data
    tmpData.shift()
    console.dir(tmpData)

    if(docData.type == "torsion"){
      var newObj = tmpData.map(function(x) { 
        return { 
          x: x[3], 
          y: x[4] 
        }; 
      });
      tmpData = newObj
    }else {
      var newObj = tmpData.map(function(x) { 
        return { 
          x: x[1], 
          y: x[2] 
        }; 
      });
      tmpData = newObj
    }
    chartDataSets.push(tmpData)
  })
  beginGraph()
}

function beginGraph(){
  chartDataSets.forEach(function(ds, i){
    var tmpDs =
    {
      label: graphData[i].name,
      backgroundColor: "transparent",
      borderColor: color[i],
      pointBackgroundColor: color[i],
      pointBorderColor: color[i],
      pointHoverBackgroundColor:color[i],
      pointHoverBorderColor: color[i],
      data: ds
    }
    datasets.push(tmpDs)

  })

  var title
  var xLabel
  var yLabel
  if(graphData.length == 1){
    if(graphData[0].type == "torsion"){
      title = "Torsion"
    } else {
      title = "Compression"
    }
  } else {
    if(graphData[0].type == "torsion"){
      title = "Torsion Comparison"
    } else {
      title = "Compression Comparison"
    }
  }

  if(graphData[0].type == "torsion"){
    xLabel = "Angle of Twist (deg)"
    yLabel = "Torque (in-lb)"
  } else {
    xLabel = "Deflection (mm)"
    yLabel = "Force (lbf)"
  }
  scatterChart = new Chart(ctx, {
    type: 'line',
    scaleStartValue : 0 ,
    data: 
        {
        datasets: datasets   
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      elements: { point: { radius: 0 } },
        title: {
            display: true,
            text: title,
            fontSize: 18
        },
        legend: {
            display: true,
            position: "bottom"
        },
        scales: {
            xAxes: [{
                type: 'linear',
                display: true,
                scaleLabel: {
                  display: true,
                  labelString: xLabel,
                  fontStyle: 'bold'
                },
                ticks: { min: 0 }
            } ],
            yAxes: [{
              type: 'linear',
              display: true,
              scaleLabel: {
                display: true,
                labelString: yLabel,
                fontStyle: 'bold'
              },
              ticks: { min: 0 }
            }]

        }
    }




});

}

//graph data
//allow export

