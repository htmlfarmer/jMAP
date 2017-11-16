/*
       jMAP: JavaScript Geocoder & Mapper (OpenStreetMaps & Google Maps)
    Version: 0.5 (PRELIMINARY)
       Date: 11/2012

OPEN STREET MAPS API: http://wiki.openstreetmap.org/wiki/Nominatim#Example (~300 ms per xml/json request - 10/2012)
GOOGLE MAPS API: https://developers.google.com/maps/documentation/geocoding/#JSON (~100 ms per request)

Example: (id is the element in the HTML DOM where you want the map)

  Map(address, id);
    UNSUPPORTED -- var address = {lat : 40, lon : -80};
    var address = "101 W. Maddison St., Chicago, IL";
    var address = ["101 W. Maddison St., Chicago, IL", "102 W. Maddison St., Chicago, IL"];
    UNSUPPORTED -- var address = {address : "101 W. Maddison St., Chicago, IL", mapper : "open", provider : "google", type : "json", html : ""};
    var address = [{address : "101 W. Maddison St., Chicago, IL"},{address : "101 W. Maddison St., Chicago, IL"}];
    var address = [{lat : 40, lon : -80}, {lat : 41, lon : -81}];
*/

/*

Map(["Chicago, IL", "San Jose, CA"], "myDivId");
  Returns a map to the myDivId with two markers

*/
function Mapper(address, id){

  var checked = FormatAddress(address);
  
  if(checked.locations[0].lat != null){
    if(checked.mapper == "open"){
      MapOpen(checked.locations, id, checked.style);
    } 
    else { // default to google maps api
      MapGoogle(checked.locations, id, checked.style);
    } 
  } 
  else { // callback function  
    Locate(checked.locations, 
      function (reply) {
        if(checked.mapper == "open"){
          MapOpen(reply, id, checked.style);
        } 
        else { // default to google maps api
          MapGoogle(reply, id, checked.style);
        } 
      });
  }
}

/* 

Locate(["Chicago, IL", "San Jose, CA"], callback);
  Returns the lat / lon of both of the address to the callback funtion

*/
function Locate(address, callback) { 
  var geocoder = new google.maps.Geocoder();
  var checked = FormatAddress(address);
  
  var addresses = checked.locations; // the address string copied from the input address
  var type = checked.type; // json or xml request type (json is slightly faster for both google and open)
  var provider = checked.provider; // "google" or "open" for open street maps (xml/json geo (lat/lon) code request) 

  // make all the requests for the geo locations (lat/lon)
  // keep these 3 here for closure reasons... 
  var locations = []; 
  var center = {lat : 0, lon : 0};

  for(var index = 0; index < addresses.length; index++){
    geocoder.geocode({address: addresses[index]}, function(reply, status){
      var location = {};
      location = Parser(reply);
      locations.push(location);
      center.lat += location.lat;
      center.lon += location.lon;
      if(locations.length == addresses.length) {
        center.lat = center.lat/addresses.length;
        center.lon = center.lon/addresses.length;
        locations.center = center; // the center is the geometric mean = Math.pow(n1 * n2 * n3..., 1/count);
        callback(locations);
      }
    });
  }
}

function FormatAddress(address) {

  var locations = []; // an array of the addresses 
  
  var specs = { provider : "open", // "google" or "open" for (lat/lon) geo code request 
                mapper : "open", // "google" or "open" (who you want to display the map)
                type : "json", // "json" or "xml" request type from the provider
                html : "",  // html to display in the info box
                style : { height : "400px", // map styles
                          width : "400px", 
                          zoom : 15}};

  if(typeof address[0] == "object" || address[0].length > 1){
    locations = address;
  }
  else {
    locations = [address];
  }

  if(typeof locations[0] == "object"){
    if(locations[0].type != null){
      specs.type = locations[0].type.toLowerCase();
    }
    
    if(locations[0].provider != null){
      specs.provider = locations[0].provider.toLowerCase(); 
    }
    
    if(locations[0].mapper != null) {
      specs.mapper = locations[0].mapper.toLowerCase();
    }
    
    if(locations[0].style != null) {
      specs.style = locations[0].style;
    } 
  
    if(locations[0].html != null) {
      specs.html = locations[0].html;
    } 
  }

  return {locations : locations, html : specs.html, type : specs.type, provider : specs.provider, mapper : specs.mapper, style : specs.style};
  
}

/* 
Parser(ajax reply, google/open, json/xml); 
   takes the reply from google maps or open street maps and creates an object with location[lat/lon] 
*/

function Parser(reply) {
  var location = {};

  if(reply != null) {
    location["lat"] = reply[0] ? reply[0].geometry.location.lat() : null;
    location["lon"] = reply[0] ? reply[0].geometry.location.lng() : null;
  }
  location.lat = parseFloat(location.lat);
  location.lon = parseFloat(location.lon);
  console.log(location)
  return location;
}

// location.lat / location.lon 
// id = <div id="id">
function MapGoogle(locations, id, style) {

  if(style == null) {
    style = {};
    style.height = "300px";
    style.width = "300px";
    style.zoom = 15;
  }
  
  // get the center of the map / default to locations[0]
  // TODO: add locations.center?
  if(locations.center){
    locations.center.lat = locations.center.lat;
    locations.center.lon = locations.center.lon;
  } 
  else {
    locations.center = {};
    locations.center.lat = locations[0].lat;
    locations.center.lon = locations[0].lon;
  }
  
  var center = new google.maps.LatLng(locations.center.lat, locations.center.lon);
  var options = { zoom: style.zoom,
                  center: center,
                  mapTypeId: google.maps.MapTypeId.ROADMAP}

  var element = document.getElementById(id);
  element.style = style;
  var map = new google.maps.Map(element, options);
  GoogleMarkers(locations, map);
  return map;
  
}

// Adding Google Markers
// https://developers.google.com/maps/documentation/javascript/overlays#Markers
function GoogleMarkers(locations, map) {

  // TODO: add labels
  var labels = locations.labels != null ? locations.labels : false;
  var label = {};
  var markers = [];
  var marker;
  
  for (var index = 0; index < locations.length; index++) {
    if(!(isNaN(locations[index].lon) || isNaN(locations[index].lat))) {
      var geo = new google.maps.LatLng(locations[index].lat, locations[index].lon);
      if(labels) {
        label.title = labels[index].title;
        label.index = labels[index].index;
      } 
      else {
        label.title = "";
        label.index = "";    
      }
      
      marker = new google.maps.Marker({
        position : geo,
        map : map,
        //draggable : true,
        //shadow : shadow,
        //icon : image,
        //shape : shape,
        //title : label.title,
        //zIndex : label.index
      });
      //markers.push(marker);
    }
    //return markers;
  }  
}

// locations = [{lat : 0.00 lon : 0.00}, {}, {}] 
// id = <div id="id">
// http://wiki.openstreetmap.org/wiki/OpenLayers_Simple_Example
function MapOpen(locations, id, style) {

  if(style == null) {
    style = {}; 
    style.height = "300px";
    style.width = "300px";
    style.zoom = 5;
  }
  
  var map = new OpenLayers.Map(id);
  var mapnik = new OpenLayers.Layer.OSM(); // if you want to show that its an OpenStreetMap
  map.addLayer(mapnik);

  var markers = new OpenLayers.Layer.Markers("Markers");
  map.addLayer(markers);
  var marks = OpenMarkers(locations, markers)
  map.setCenter(marks.center, style.zoom);
  
}

// OpenMarkers([{lat : 0.00, lon : 0.00},{},...]);
// returns a lit of all the markers to be added in Open Street Maps Geo Code Format
//    and also something that is approximatly the center of the markers... (speed?)
function OpenMarkers(locations, markers) {

  //var markers = new OpenLayers.Layer.Markers("Markers");
  var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
  var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
  var position;

  var position; 
  var lon;
  var lat;
  var average = {lon : 0.0, lat : 0.0};
  var total = locations.length;
  
  for (var loc = 0; loc < locations.length; loc++) {
    lon = locations[loc].lon; 
    lat = locations[loc].lat;
    if(!(isNaN(lon) || isNaN(lat))) {
      average.lon += lon;
      average.lat += lat;
      position = new OpenLayers.LonLat(lon, lat).transform( fromProjection, toProjection);
      marker = new OpenLayers.Marker(position)
      markers.addMarker(marker);
    }
  }
  
  // next calculate the center of the markers... this is approximately the center
  average.lon = average.lon / total;
  average.lat = average.lat / total;
  
  // TODO: Add harmonic mean to center the map.
  var approximate = new OpenLayers.LonLat(average.lon, average.lat).transform( fromProjection, toProjection);

  return {markers : markers, center : approximate};

}

// convert the an XML text string to an XML object
// window.JSON.parse (native json parser)
var XML = {parse : 
  function(text){
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