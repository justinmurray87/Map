// define variables to be used on the map
let map;
let shopMarker;
let infowindow;
//load map with custom styles
function loadMap() {
    'use strict';
    const mapuistyles = [
        {
            featureType: 'water',
            stylers: [
                { color: '#19a0d8' },
            ],
        }, {
            featureType: 'administrative',
            elementType: 'labels.text.stroke',
            stylers: [
                { color: '#ffffff' },
                { weight: 6 },
            ],
        }, {
            featureType: 'administrative',
            elementType: 'labels.text.fill',
            stylers: [
                { color: '#e85113' },
            ],
        }, {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [
                { color: '#efe9e4' },
                { lightness: -40 },
            ],
        }, {
            featureType: 'transit.station',
            stylers: [
                { weight: 9 },
                { hue: '#e85113' },
            ],
        }, {
            featureType: 'road.highway',
            elementType: 'labels.icon',
            stylers: [
                { visibility: 'off' },
            ],
        }, {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [
                { lightness: 100 },
            ],
        }, {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [
                { lightness: -100 },
            ],
        }, {
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [
                { visibility: 'on' },
                { color: '#f0e4d3' },
            ],
        }, {
            featureType: 'road.highway',
            elementType: 'geometry.fill',
            stylers: [
                { color: '#efe9e4' },
                { lightness: -25 },
            ],
        },
    ];

    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 37.773972, lng: -122.431297 },
        zoom: 10,
        styles: mapuistyles,
        });

    //Marker info box - create once, content bind at run time
    infowindow = new google.maps.InfoWindow();

    ko.applyBindings(new myViewModel());
}

// View Model
const myViewModel = function () {

var self = this
// define more variables to be used in the list and filter
self.storelocations = ko.observableArray([]);
self.headline = ko.observable('');
self.filter = ko.observable(false);
self.lastSelectedShop;

// asynchronous ajax request to Foursquare
  var fourquarerequest = $.ajax({
            async: true,
            url: 'https://api.foursquare.com/v2/venues/search',
            dataType: 'json',
            data: 'client_id=U2MLND3P2NGMOPEBE0Y0N5H3QNM30XC3GTKDRDEESN1NJ05X&client_secret=T2IFNX3XDQJ0RJC2341QI5G2WBTI1JN30YWQ1ZPWGXRELMXW&v=20130815%20&ll=37.773972,-122.431297%20&query=surfshop',
        })

      //once the requst is complete, process the responses using the Foursquare function
              fourquarerequest.done((response) => {


                    data = response.response.venues;

                   // loop through the responses and process them
                    $.each(data,function(i,name){

                      shop = new shopdetails(name);
                      // push the processed responses to the KO observableArray
                      self.storelocations.push(shop);
                    })
                    console.dir(self.storelocations);
                    // publish the final count to the UI
                    self.headline(`${self.storelocations().length} Surf Shops`);

                });
//prepares data for list, marker, and InfoWindow
  var shopdetails = function (data) {
        var self = this;
        self.name = data.name;
        self.lat = data.location.lat;
        self.lng = data.location.lng;
        self.latlon =new google.maps.LatLng(self.lat, self.lng);
        self.URL = data.url;
          if (typeof self.URL === 'undefined') {
              self.URL = "";
            }
        //create a new marker for this location and add it to the map
        self.marker = (function (shop) {
          let marker;
              marker = new google.maps.Marker({
                  position: self.latlon,
                  map: map,
              });
          return marker;
        })(self);
        self.street = data.location.formattedAddress || 'No Address Provided';
        self.city = data.location.city || 'No City Provided';
        self.phone = data.contact.formattedPhone || 'No Phone Provided';
      };

//sets the visible markers depending on the filter
  markerVisible = function(shops,filter){
        $.each(self.storelocations(),function(i,store){
            if(filter || shops.indexOf(store) > -1){
                store.marker.setVisible(true);
            }
            else{
                store.marker.setVisible(false);
            }
        })
    }

//
  self.selectshop = function () {
    //onclick (see data-bind index.html UL)
    //close any open info windows
    var selected = this;
    //formatted info window content to display name, url, street, city, and phone
    var content = `<div>
                        <p>
                            <h5>  ${selected.name}  </h5>
                            <a href="${selected.URL}">${selected.URL}</a>  <br>
                            <strong>City:</strong>  ${selected.city}  <br>
                            <strong>Street:</strong>  ${selected.street}  <br>
                            <strong>Phone:</strong>  ${selected.phone} <br>
                          </ul>
                        </p>
                    </div>`;

    infowindow.setContent(content);
    //display info window with clicked storelocations details
    infowindow.open(map,selected.marker);
    //make selected icon bounce
    selected.marker.setAnimation(google.maps.Animation.BOUNCE);
    //resets unselected markers to stop bouncing
    if(self.lastSelectedShop != undefined){
        self.lastSelectedShop.marker.setAnimation(null);
    }

    self.lastSelectedShop = selected;
  }

  //if filter (checkbox) is enabled, display only shops with city === 'San Francisco'
  //else, display all shops
  self.filterStores = ko.computed({ read:function () {

        var stores;
        if (!self.filter()) {
            stores =  self.storelocations();
        } else {
            stores = ko.utils.arrayFilter(self.storelocations(), function (store) {
                return store.city.toUpperCase() == "SAN FRANCISCO";
            });
        }

        markerVisible(stores,!self.filter());
        return stores;
    }});

};
