document.addEventListener('init', function(event) {
    if (event.target.matches('#mapPage')) {
        getMapLocation();
    }
}, false);

var Latitude = undefined;
var Longitude = undefined;

// Get geo coordinates
function getMapLocation() {
    navigator.geolocation.getCurrentPosition(onMapSuccess, onMapError, { enableHighAccuracy: true });
}

// Success callback for get geo coordinates
var onMapSuccess = function (position) {
    Latitude = position.coords.latitude;
    Longitude = position.coords.longitude;
    getMap(Latitude, Longitude);
}

// Get map by using coordinates
function getMap(latitude, longitude) {
    var map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        center: new Microsoft.Maps.Location(latitude, longitude),
        zoom: 15
    });

    var pushpin = new Microsoft.Maps.Pushpin(map.getCenter(), null);
    map.entities.push(pushpin);
}

// Success callback for watching your changing position
var onMapWatchSuccess = function (position) {
    var updatedLatitude = position.coords.latitude;
    var updatedLongitude = position.coords.longitude;

    if (updatedLatitude != Latitude && updatedLongitude != Longitude) {
        Latitude = updatedLatitude;
        Longitude = updatedLongitude;
        getMap(updatedLatitude, updatedLongitude);
    }
}

// Error callback
function onMapError(error) {
    console.log('code: ' + error.code + '\n' +
        'message: ' + error.message + '\n');
}

// Watch your changing position
function watchMapPosition() {
    return navigator.geolocation.watchPosition(onMapWatchSuccess, onMapError, { enableHighAccuracy: true });
}