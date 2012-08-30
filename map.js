// DATE: 8/2012
// AUTHOR: V$H 

/*
Map(address, id) // id isn't needed
  address = "string" (by default or... you can create a dictionary)
  address.fullname = "1111 W. 35th Street, Chicago, IL 60609 USA";
  address.provider = "open"; or "google"; // whatever dataprovider you want to read the lat/lon from.
  address.mapper = "open"; or "google"; // whatever you want to map your result
  address.type = "json" or "xml"; // json is default
  address.id = "my-div"; // location that the image should be placed the name of the ID tag
*/

// OPEN STREET MAPS API: http://wiki.openstreetmap.org/wiki/Nominatim#Example
// GOOGLE MAPS API: https://developers.google.com/maps/documentation/geocoding/#JSON

// FUTURE: this code should be library independent and rely only on native JavaScript for XML/JSON parsing.

function Map(address, id) { 
  var uri = "request.php"; // the uri used to do a remote geocode lookup 
  var type = "xml"; // json or xml request type
  var addr = ""; // the address string copied from the input address
  var provider = "google"; // google or open (who you want to make the geo code request from) 
  var mapper = "open"; // google or open (who you want to display the map)
  var id = "mapdiv"; // the location div block id tag where you want your map placed
  var style = {height : "400px", width : "400px", zoom : 15};

  if(address.fullname != null){
    uri = address.uri;
    type = address.type;
    type = type.toLowerCase();
    addr = address.fullname;
    provider = address.provider; 
    provider = provider.toLowerCase();
    mapper = address.mapper; 
    mapper = mapper.toLowerCase();
    if(id == null){
      id = address.id;
    } else {
      id = id;
    }
    style = address.style;
  } else {
    addr = address;
    if(id == null){
      var div = document.createElement('div');
      div.setAttribute('id', id);
      var element = document.body; // locate the body of the HTML
      element.appendChild(div); // create a default div block to place the map
    } else 
    id = id;
  }

  if(provider == "google") {
    uri = uri+"?uri="+GoogleURI(addr, type)+"";
  } else { // open street maps is the default ;O)
    uri = uri+"?uri="+OpenURI(addr, type)+""; 
  }

  Request(uri, function(reply){
    var location = {};
    location = Parser(reply.response, provider, type);
      if(mapper == "open") {
        MapOpen(location, id, style);
      } 
      else { // default to google maps api
        MapGoogle(location, id, style);
      } 
  });  
}

// Parser(ajax reply, google/open, json/xml); 
// takes the reply from google maps or open street maps and creates an object with location[lat/lon] 
function Parser(text, provider, type) {
  var location = {};
  var geo = {};
  switch(type) {
    case "xml":
      geo = XML.parse(text); // TODO: these need to be rewritten to parse only the field needed
    break;
    case "json":
      geo = JSON.parse(text); // TODO: these need to be rewritten to parse only the field needed
    break;
    default:// case "text":
      geo = text;
  }
  var reply = geo;  
  if(reply != null) {
    if(provider == "google") { // Google Street Maps
      switch(type) {
        case "xml":
          location["lat"] = reply.getElementsByTagName("lat")[0].textContent; 
          location["lon"] = reply.getElementsByTagName("lng")[0].textContent; 
          break;
        default: // json
          location["lat"] = reply.results[0].geometry.location.lat;
          location["lon"] = reply.results[0].geometry.location.lng;
      }
    }
    else { // Open Street Maps
      switch(type) {
      case "xml":
        location["lat"] = reply.getElementsByTagName("place")[0].getAttribute("lat"); 
        location["lon"] = reply.getElementsByTagName("place")[0].getAttribute("lon"); 
        break;
      default: // json
        location["lat"] = reply[0].lat;
        location["lon"] = reply[0].lon;
      }
    }
  }
  return location;
}

// URL ENCODINGS: http://www.w3schools.com/tags/ref_urlencode.asp
// +   %2B 
// , 	%2C
// & 	%26
// space %20 
// this version only replaces spaces with %20 because the php request does the rest
function FormatAddress(address) {
  var result = "";
  if(typeof address == "string") {
    return address.replace(/ /g, "%20");
  } else { // check the address carefully... this might not always work... 
    for (addr in address){
      address[addr] = address[addr].replace(/ /g, "%20");
      if((addr != "state") && (addr != "zip")){
        //result += "+" + address[addr] + ",";
        result += "%20" + address[addr] + "%2C"; // if uri encoding is needed
      }
      else {
        //result += "+" + address[addr];
        result += "%20" + address[addr]; // if uri encoding is needed
      }
    }
  return result;
  }
}

// GOOGLE MAPS API v3
// API: https://developers.google.com/maps/documentation/geocoding/#GeocodingRequests
// Example JSON request: http://maps.googleapis.com/maps/api/geocode/json?address=1111%W.%2035rd%20street,%20Chicago,%20IL&sensor=true
function GoogleURI(address, type){
  var uri = "http://maps.googleapis.com/maps/api/geocode/";
  address = FormatAddress(address);
  if(type == "xml"){
    uri = uri + type + "?" + "address=" + address + "%26sensor=false";
  } else { // default to json
    uri = uri + "json" + "?" + "address=" + address + "%26sensor=false";
  }
  return uri; 
}

// OPEN STREET MAP API 0.6
// API: http://wiki.openstreetmap.org/wiki/Nominatim#Example
// Example XML Request: http://nominatim.openstreetmap.org/search?q=%201111%20W.%2035th%20Street,%20Chicago&format=xml&addressdetails=1
// NOTE &'s and spaces dont pass easily to php and then to nominatim.openstreetmap.org
// WARNING: OPEN STREET MAPS SOMETIMES DOESNT NEED THE STATE AND ZIP CODE and in fact will error out... ;)
function OpenURI(address, type){
  var uri = "http://nominatim.openstreetmap.org/search?q=";
  var format = "%26format=" + type; 
  var details = "%26addressdetails=1";
  address = FormatAddress(address);
  // NOTE: &'s dont pass good to php file_get_contents($uri) dont use "&polygon=1&addressdetails=1";
  if(type == "xml"){
    uri = uri + address + "%26format=" + type + "%26addressdetails=1";
  } else { // default to json
    uri = uri + address + "%26format=" + "json" + "%26addressdetails=1";
  } 
  return uri; 
}

// Request(request.php, callback handler, data for post requests isn't used yet)
// really doesn't return anything and needs a callback function handler
function Request(uri, callback, data) { //data = null; // right now we dont support post requests.. :(
  var xmlhttp;
  if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
    }
  else {// code for IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function(){
      if (xmlhttp.readyState==4 && xmlhttp.status==200) {
          callback(xmlhttp);
      }
    }
    if(data != null){
      xmlhttp.open("POST", uri, true); 
      xmlhttp.send(data);
    }
    else {
      xmlhttp.open("GET", uri, true); 
      xmlhttp.send();
    }
}

// location.lat / location.lon 
// id = <div id="id">
function MapGoogle(location, id, style) {

  if(style == null) {
    style = {};
    style.height = "300px";
    style.width = "300px";
    style.zoom = 15;
  }

  var latlng = new google.maps.LatLng(location.lat, location.lon);
  var options = { zoom: style.zoom,
                  center: latlng,
                  mapTypeId: google.maps.MapTypeId.ROADMAP}

  var element = document.getElementById(id);
  element.style = style;
  var map = new google.maps.Map(element, options);
 
  var marker = new google.maps.Marker({
          map:map,
          draggable:true,
          animation: google.maps.Animation.DROP,
          position: latlng
  });
    
  google.maps.event.addListener(marker, 'click', function() {
    if (marker.getAnimation() != null) { marker.setAnimation(null); } 
    else { marker.setAnimation(google.maps.Animation.BOUNCE);}
  });
  
}

// location.lat / location.lon 
// id = <div id="id">
function MapOpen(location, id, style) {

  if(style == null) {
    style = {}; 
    style.height = "300px";
    style.width = "300px";
    style.zoom = 5;
  }

  element = document.getElementById(id);
  element.style.width=style.width;
  element.style.height=style.height;
  
  if(document.getElementById(id).childNodes()){
        
  }
  map = new OpenLayers.Map(id);
  map.addLayer(new OpenLayers.Layer.OSM());   // TODO: placement needed
 
  var lon = location.lon; 
  var lat = location.lat; 
 
  var lonLat = new OpenLayers.LonLat( lon, lat )
        .transform(
          new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
          map.getProjectionObject() // to Spherical Mercator Projection
        );

  var markers = new OpenLayers.Layer.Markers( "Markers" );
  map.addLayer(markers);

  markers.addMarker(new OpenLayers.Marker(lonLat));

  map.setCenter (lonLat, style.zoom);
}

// convert the an XML text string to an XML object
// window.JSON.parse (native json parser)
var XML = {parse : function(text){
    var obj = {};
    if (window.ActiveXObject){ // TODO: not tested on IE (is this even needed anymore??)
      obj=new ActiveXObject('Microsoft.XMLDOM');
      obj.async='false';
      obj.loadXML(text);
    }
    else {
      var parser=new DOMParser();
      obj=parser.parseFromString(text,'text/xml');
    }
    return obj;
  }
}