/****************************
 * Main file
 * 
 *****************************/

// this is the root namespace of my application
LMT = {};

//create namespaces
LMT.events = {};
LMT.ui = {
  html: {},       // all the html based interactions
  svg: {},        // all that happens on the svg moddeling layer (input)
  output: {},     // takes care of displaying the results
  };
LMT.objects = {}; // collection of all objects available
LMT.com = {};    // all the communication routines (websocket)
LMT.utils = {};   // some utils


LMT.modelData = {};
LMT.simulationResult = {}; // one should not use this anymore
LMT.simulationResult = {};

LMT.datasources = {};
LMT.datasource = {};

LMT.settings = {
  
	mode: 'image',  // 'none'for doing nothing; 'image' for images; 'ruler' for adding rulers; 'mass' to add external masses 
	
	display: {
		paintContours: true,
		paintContourPoints: true,
		paintConnectingLines: false,
		
		// translation vector and scale for the canvas
		zoompan: {x:0, y:0, scale: 1}
	},
	
	nPointsPerContour: 4, //how many points does one contour initially have
	
	nUndoActions: 20, //how many actions can be undone?
	nRedoActions: 20, //same for redo
	
	
	tmp: 0
}

/*
this fnc saves the arguments attached to the url to an $_GET object
(similar to php)
*/
function initGetVars() {
  var parts = window.location.search.substr(1).split("&");
  GET = {};
  GET['nArgs'] = parts.length;
  GET['array'] = new Array();

  for (var i = 0; i < parts.length; i++) {
      var temp = parts[i].split("=");
      GET[decodeURIComponent(temp[0])] = decodeURIComponent(temp[1]);
      GET['array'].push(parts[i]);
  }
  LMT.GET = GET;
}

var log = {};
var logger = null;

$(document).ready(function(){

  if (doLog) {
    logger = new LMT.utils.logger(logToConsole)
    log = logger.log;
  }
  else {
    logger = {toggle:function(){}};
    log = function(){};
  }


  log('document | ready | init complete');
  LMT.events.startUp();
  log('document | ready | startup complete');


  

  //for debug purposes, trigger some events manually

  /*
  var ch = [
    {r:1,g:0,b:0,contrast:1,brightness:0},
    {r:0,g:1,b:0,contrast:1,brightness:0},
    {r:0,g:0,b:1,contrast:1,brightness:0}
  ];
  var url = [
    "img/demo-ch1.png",
    "img/demo-ch2.png",
    "img/demo-ch3.png"
    ];
  LMT.modelData = {
    url: url,
    ch: ch
  };
  $.event.trigger('ReceivedModelData');
  */


/*
  maybe switch to besser data structre like this
  modelData[i] = {
    short: 'K',
    name: 'near IR',
    color: {r:1, g:0, b:0},
    brightness: 0,
    contrast: 1;
    img_url: 'http:....',
  }
*/
  
  //----------------------  

/*
  LMT.modelData.currentSimulationImageURLs = ["img/demo-ch1.png", "img/demo-ch2.png","img/demo-ch3.png","img/demo-ch3.png","img/demo-ch3.png"];
  $.event.trigger("ReceivedSimulation");  
*/
  

	
});


