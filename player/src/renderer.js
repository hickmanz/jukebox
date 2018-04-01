import { deflate } from 'zlib';
import { isRegExp } from 'util';

import { request } from 'https';

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const serverAddr = 'http://localhost:3000'
var player;
var tokenData;
var player_id;

  window.onSpotifyWebPlaybackSDKReady = () => {

    player = new Spotify.Player({
      name: 'Mixer Jukebox',
      getOAuthToken: cb => {
        socket.emit('player-get-token', 'holder', function(data){
          tokenData = data
          var token = tokenData.access_token 
          console.log(token)
          cb(token);

        })
        
       }
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    // Playback status updates
    player.addListener('player_state_changed', state => { 
      console.log(state);
      socket.emit('player_state_changed', state) 
    });

    // Ready
    player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      socket.emit('player-ready', device_id)
      player_id = device_id
    });
    // Connect to the player!
    player.connect();
  };

const $ = require('jquery');
const ipc = require('electron').ipcRenderer;
const path = require('path')
const fs = require('fs-extra')
var tmp = require('tmp');
const remote = require('electron').remote; 
const app = remote.app;
const dateFormat = require('dateformat');
const nav = require('./assets/nav')
const settings = require('electron').remote.require('electron-settings');
const socket = require('socket.io-client')(serverAddr);

socket.on('connect', function(){
  console.log('connected to server')
  if (player_id !== null){
    socket.emit('player-ready', player_id)
  }

});

socket.on('updateTokenData', function(data){
  console.dir(data)
  tokenData = data
})
socket.on('set-volume', function(data){

})
socket.on('get-state', function(data){
  player.getCurrentState().then(state => {
    console.dir(state);
  });

})
const Datastore = require('nedb');
const db = new Datastore({ filename: path.join(app.getPath('userData'), 'main.db'), autoload: true, timestampData: true  });


var selectedDirectory;
var caliperPort;

var tmpDir;
var selectedFile

var isRunning = false;
var caliperOffset = 0;
var deflectionUnitsMM = true;
var lastCaliperRead;

var deflectionData ={
  df:[],
  type: ""
}

var chartData = {
  datasets:[
    {
      label: 'Deflection',
      borderColor: '#c14c4c',
      data:[]
    }
  ]
};

var testType;
var forceUnits;
var torqueArmLng;
var forceStartVal = 0.1;
var testName

var prevTime;

var deflectionChart
var ctx;
var options = {
  animation: false,
  responsive: true,
  maintainAspectRatio: false,
  elements: { point: { radius: 0 } },
  scales:{
    xAxes: [{
      type: 'linear',
      display: true,
      scaleLabel: {
        display: true,
        labelString: 'Time (s)',
        fontStyle: 'bold'
      },
      ticks: {
        callback: function(value, index, values) {
          return parseFloat(value).toFixed(2);
        },
          autoSkip: true,
          maxTicksLimit: 30,
          stepSize: .1
        }
      }],
      yAxes: [{
        type: 'linear',
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Deflection (mm)',
          fontStyle: 'bold'
        }
      }]
    }
  
};
console.log(app.getAppPath())
fs.ensureDir(app.getPath('userData') + '/tmp', err => {
  console.log(err) // => null
  tmpDir = app.getPath('userData') + '/tmp'

})

const continueBtn = document.getElementsByClassName('continue-btn');
const connectBtn = document.getElementById('connect-calipers');
const zeroBtn = document.getElementById('zero-calipers');
const portSelector = document.getElementById('portNumber');
const testTypeSelector = document.getElementById('testType');
const forceUnitSelector = document.getElementById('forceUnitsSelect');
const testStartBtn = document.getElementById('start-test');
const testStopBtn = document.getElementById('stop-test');
const selectDirBtn = document.getElementById('select-directory');
const choseFileBtn = document.getElementById('chose-file');
const graphBtn = document.getElementById('graph-data');
const deleteBtn = document.getElementById('delete-data');

graphBtn.addEventListener('click', function(event){
  //get seleteced IDs and send to graph
  var checked = $('#testList input:checked').map(function(){
    return $(this).val();
  }).get();

  if(checked.length == 0){
    alert('Nothing selected')
  } else {
    graphData(checked);
  }

})
deleteBtn.addEventListener('click', function(event){
  var checked = $('#testList input:checked').map(function(){
    return $(this).val();
  }).get();

  if(checked.length == 0){
    alert('Nothing selected')
  } else {
    db.remove({_id: { $in: checked}}, { multi: true }, function (err, numRemoved) {
      if(err){
        alert(err)
      }
      updateTestList()
    });
  }
})

selectDirBtn.addEventListener('click', function (event) {
  ipc.send('open-file-dialog');
});

choseFileBtn.addEventListener('click', function (event) {
  


});

ipc.on('selected-directory', function (event, path) {
  document.getElementById('selected-file').innerHTML = `You selected: ${path}`;
  selectedFile = path;
  document.getElementById('chose-file').classList.remove('inactive');
})

$("#torque-arm-length").on("change paste keyup", function() {
  torqueArmLng = parseFloat($(this).val());
});
$("#force-start-value").on("change paste keyup", function() {
  forceStartVal = parseFloat($(this).val());
});

zeroBtn.addEventListener('click', function(event){
  caliperOffset = lastCaliperRead;
});

testStartBtn.addEventListener('click', function(event){
  isRunning = true;
  chartData.datasets[0].data =[];
  deflectionData.df = [];
  deflectionData.type = testType;
  deflectionData.forceUnits = forceUnits;
  if(testType == "Torsion"){
    deflectionData.torqueArmLng = torqueArmLng;
  }
  deflectionData.forceStartVal = forceStartVal;
  nav.switchToPage('running');
});

testStopBtn.addEventListener('click', function(event){
  isRunning = false;
  deflectionChart.destroy()
  nav.switchToPage('post-run');
});

forceUnitSelector.addEventListener('change', function(event){
  forceUnits = forceUnitSelector.options[forceUnitSelector.selectedIndex].value;
  document.getElementById("force-units").innerHTML = forceUnits;

});

testTypeSelector.addEventListener('change', function(event){
  testType = testTypeSelector.options[testTypeSelector.selectedIndex].value;
  
  if(testType == "torsion"){
    document.getElementById('torque-arm-section').style.visibility = "visible";
  } else {
    document.getElementById('torque-arm-section').style.visibility = "hidden";
  }

});

portSelector.addEventListener('click',function(ev){

});

connectBtn.addEventListener('click', function (event) {

});

for (var i = 0; i < continueBtn.length; i++) {
  continueBtn[i].addEventListener('click', function (event) {
    if(!$(this).hasClass('inactive')){
      continueClicked(nav.getCurrentPage());
    }
  });
}


socket.on('test', function (data){
  console.dir(data);
})
function graphData(dataIds){
  ipc.send('graph-data', {dataIds: dataIds})
}

//Initialize windows 
function init() { 
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
    const window = remote.getCurrentWindow();
    window.close();
  }); 


  ctx = document.getElementById("myChart").getContext("2d");  
}; 

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
    init(); 
    console.log('another one');
  }
};




function continueClicked(page){
  switch (page) {
    case 'setup':
      settings.set('setup', {
        'isComplete': true
      });
      nav.switchToPage('connect');
      return true;
    
    case 'connect':
      nav.switchToPage('test-setup');
      return true;

  }
}

var processCalipers = function(data){
  data = parseFloat(data).toFixed(2)
  lastCaliperRead = data;
  var deflection;

  if(deflectionUnitsMM){
    deflection = (data - caliperOffset).toFixed(2);
  } else {
    deflection = (data - caliperOffset) * 0.0393701;
  }
  if(testType == 'torsion' || testType == 'compression'){
    deflection = deflection * -1;
  }
  if(isRunning){
    if(deflectionData.df.length == 0){
      prevTime = new Date().getTime();

      deflectionData.df.push({'Deflection': deflection, 'Time': 0});
      chartData.datasets[0].data.push({x: 0, y: parseFloat(deflection)});
      deflectionChart = new Chart(ctx, {type:'line', data: chartData, options: options});

    } else {
      var timeChange = (new Date().getTime() - prevTime )/1000;
      prevTime = new Date().getTime();
      var newTime = deflectionData.df[deflectionData.df.length-1].Time + timeChange;

      deflectionData.df.push({'Deflection': deflection, 'Time': newTime});
      chartData.datasets[0].data.push({x: newTime, y: parseFloat(deflection)});
    }
    document.getElementById("currentDeflection-running").innerHTML = deflection;
    //var myLineChart = new Chart(ctx, {type:'line', data: chartData, options: options});
    deflectionChart.update()
  } else {
    document.getElementById("currentDeflection").innerHTML = deflection;
  }

}