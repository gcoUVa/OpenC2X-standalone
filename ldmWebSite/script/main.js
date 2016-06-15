
/**
 *updateFunction is repeatedly called to provide data for this div. should take a callback which shall be called with the retrived data 
 * @param updateFunction fn(callback)
 */
function Container(name,updateFunction,color,updateInterval){
	this.updateInterval = updateInterval || 1000;
	var color = color || "#555555";
	this.id = name;
	this.updateFunction = updateFunction;
	this.intervalID = -1;
	var htmlstr = 
		'<div id="'+name+'" class="container dataContainer"> '+
        	'<h4 style="display:inline-block">'+name+'</h4>'+
        	'<div style="background:green" class="updateButton"></div>'+
        	'<table id="'+name+'_data">'+
				'<tr><td>loading</td><td>Data</td></tr>'+
        	'</table>'+
    	'</div>';
	$("body").append(htmlstr);
	var div = $("#"+name).draggable().resizable();
	div.css("border-color",color);
	div.css("background",increase_brightness(color, 70));
	this.dataTable = $("#"+name+"_data");
	this.setTable = function(data){
		$("#"+this.id+"_data").html(objectToTable(data));
	}.bind(this);
	
	this.updateButton = div.children(".updateButton");
	this.enableUpdate = function(){
		if (this.intervalID === -1){
			this.intervalID=window.setInterval(
				function(){this.updateFunction(this.setTable);}.bind(this),
				this.updateInterval
			);
			this.updateButton.css("background","green");
		}
	}.bind(this);
	this.enableUpdate();
	
	this.disableUpdate = function(){
		window.clearInterval(this.intervalID);
		this.intervalID=-1;
		this.updateButton.css("background","red");
	}.bind(this);
	
	this.toggleUpdate= function(){
		if (this.intervalID ===-1){
			this.enableUpdate();
		} else {
			this.disableUpdate();
		}
	}.bind(this);
	this.updateButton.click(this.toggleUpdate);
}

/**
 * holds and updates most recend cam data for each station id
 */
camData = {
	mymac : "",
	cams : new Map(),
	refreshRate : 1000,
	lastUpdate : 0,

	/**
	 * checks whether camData is inialised and initialises it if not
	 * @returns {Boolean} is initalised
	 */
	init : function(){
		if (this.mymac == ""){//is not initalised
			requestMyMac(function(data) {
				this.mymac = data.myMac;
			}.bind(this));
			return false;
		} else {
			return true;
		}
	},
	/**
	 * takes a response object from "webAppQuerys.js" and updates camDatas cam map
	 * @param data
	 */
	digestCams : function(data){
		if (camData.init()){ //is initalised
			data.msgs.forEach(function(cam) {
				if(camData.cams.get(cam.stationId)){
					if (camData.cams.get(cam.stationId).createTime < cam.createTime){
						camData.cams.set(cam.stationId,cam);
					}
				} else {
					camData.cams.set(cam.stationId,cam);
				}
			})
			
		}
	},
	
	updateCams: function(){
		if (this.lastUpdate+this.refreshRate < new Date().getTime()){
			requestCam(this.digestCams);
		}
	},
	getLastOwnCam : function(callback){
		camData.updateCams();
		if(callback){
			callback(camData.cams.get(camData.mymac));
		} else {
			return camData.cams.get(camData.mymac);
		}
	},	
};

function initMap(){
	//init map
	map = L.map('mapContainer');

	// create the tile layer with correct attribution
	var osmUrl="map/openstreetmap/{z}/{x}/{y}.png";
	//online map 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	//marbel chache file:///home/jonh/.local/share/marble/maps/earth/openstreetmap/{z}/{x}/{y}.png
	
	
	var osmAttrib='Map data cr <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 1, maxZoom: 18, attribution: osmAttrib,trackResize:true});		

	// start the map in Paderborn
	viewPosition = [51.7315, 8.739];
	map.setView(viewPosition,15);
	map.addLayer(osm);
	
	markers = [];
	
	window.setInterval(function(){
		var cam = camData.getLastOwnCam();
		if (camData.mymac != ""){//not uninitalised
			markers.forEach(function(marker) {
				map.removeLayer(marker);
			})
			var myIcon = L.icon({
				    iconUrl: 'image/marker/marker-icon-red.png',
				});
			
			camData.cams.forEach(function(cam, key) {
				if ( key == camData.mymac){//own cam
					if(cam.gps){
						viewPosition = [cam.gps.latitude,cam.gps.longitude];
						markers.push(L.marker(viewPosition).addTo(map));
					}
				} else {//other cams : red marker
					if(cam.gps){
						markers.push(L.marker([cam.gps.latitude,cam.gps.longitude],{icon: myIcon}).addTo(map));
					}
				}
			})
		}
		map.invalidateSize();
		map.setView(viewPosition);
	},2000);
	

	$("#mapWrapper").draggable().resizable();
}

$(document).ready(function(){
	
	initMap();
	
	var counter = 1;
	
//	var carContainer = new Container("car", function(callback) {
//		callback({speed:counter,rpm:counter++ * 36,driver:"alive"});
//	},color="#ff2222");
//	
//	var dccContainer = new Container("dcc", function(callback) {
//		callback({status:"running", queued:(counter*93)%77,state:(counter%2 === 0)?"busy":"relaxed",queueBE:2,queueBK:5,queueVI:0,queueVO:100});
//	},color="#22ff22");
	
});

/* Open when someone clicks on the button element */
function openNav() {
    document.getElementById("myNav").style.width = "50%";
}

/* Close when someone clicks on the "x" symbol inside the overlay */
function closeNav() {
    document.getElementById("myNav").style.width = "0%";
}