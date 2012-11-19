/*
  this script contains all the communication routines

*/

/*
  gets the location of the images from the server
  depending on the provided id
*/
function getBGImageUrls(id) {
  var onopen = function () {
    sock.send("p_id"+id);
    dbg.write("Sent: " + "p_id"+id);
  };
  var onmessage = function (e) {
    if (e.data.substring(0,4) == "limg") {
      var limg = e.data.substring(4);
      dbg.write("got image url: " + limg);
      loadImage(limg);
    }
    else {
      dbg.write("got error: " + e.data);
    }
  };
  var sock = openSocket(onopen, null, onmessage);
}



function calculateModel() {
  //set cursor to busy
  //open socket
  //get points
  //send points
  //on message: statusreport -> update
  //            picture url -> load picture, close socket
  


  var onopen = function () {
    //dbg.write("Connected to " + wsuri);
    var points = getPoints();
    //var serialised_points = JSON.stringify(points);
    var serialised_points = serializePoints(points);
    sock.send("pnts" + serialised_points);
    //dbg.write("Sent: " + serialised_points);
  };
  
  var onmessage = function (e) {
    var ident = e.data.substring(0,4); 
    var data = e.data.substring(4);
    if ( ident == "cont") {
      dbg.write("got contour image url: " + data);
      var img = document.getElementById('glassimg');
      img.setAttribute('src', ''+data);
    }
    else if (ident=="stat") {
      dbg.write("got status: " + data);
    }
    else {
      dbg.write("got error: " + e.data);
    }
  };
  
  var sock = openSocket(onopen, null, onmessage);

}


function serializePoints(pnts) {
  var out = "";
  out += "000" + $_GET.id;
  for (var i=1; i<pnts.length; i++) { //the first points is not needed, it's 0/0 anyways
    out += "|" + pnts[i].x/200.0 + ":" + pnts[i].y/200.0 + ":" + pnts[i].type;
    //TODO make better scaling
  }
  out += "|0.50:1.00";
  return out;
}

var port = 8080;
var server_url = window.location.hostname;


function openSocket(onopen_fn, onclose_fn, onmessage_fn) {
  var wsuri;
  var sock;
  if (window.location.protocol === "file:") {
     wsuri = "ws://localhost:8080";
  } else {
     wsuri = "ws://" + server_url + ":" + port;
  }

  if ("WebSocket" in window) {
     sock = new WebSocket(wsuri);
  } else if ("MozWebSocket" in window) {
     sock = new MozWebSocket(wsuri);
  } else {
     alert("Browser does not support WebSocket!");
  }

  if (sock) {
     sock.onopen = onopen_fn;

     sock.onclose = onclose_fn ? onclose_fn : function(e) {
        dbg.write("Connection closed (wasClean = " + e.wasClean + ", code = " + e.code + ", reason = '" + e.reason + "')");
        sock = null;
     }

     sock.onmessage = onmessage_fn ? onmessage_fn : function(e) {
        dbg.write("Got: " + e.data);
     }
  }
  return sock;
}