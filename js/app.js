'use strict';

/* function callback on successful load of google Maps */
function googleSuccess() {
  /* constructor for ko observable list */
  function Placed(name, url, lat, long) {
    var self = this;
    self.name = ko.observable(name);
    self.url = ko.observable(url);
    self.lat = ko.observable(lat);
    self.long = ko.observable(long);
  }

  function appViewModel() {
    var self = this;
    self.titleMsg = ko.observable('Los Angeles Attractions')
    self.losAngelesWeather = ko.observable(); // weather in fahrenheit
    self.messageBox = ko.observable(); // error message
    self.placeVal = ko.observable(); // input value
    self.places = ko.observableArray([]); // places array
    self.visibleTable = ko.observable(true);

    self.hideTable = function() { 
      self.showListButton(true); 
      self.hideListButton(false);
      self.visibleTable(false);
    };
    
    self.showTable = function() {
      self.showButton(false);
      self.showListButton(false); 
      self.hideListButton(true);
      self.visibleTable(true);      
    };
    
    self.searchWord = ko.observable();
    self.showButton = ko.observable(false);
    self.showListButton = ko.observable(false);
    self.hideListButton = ko.observable(true);

    var attractions = [ // initial array of objects
    { loc: 'Universal CityWalk', 
      url: 'http://www.universalstudioshollywood.com/',
      lat: 34.1364911,
      long: -118.3553787
    },
    { loc: 'Griffith Observatory',
      url: 'http://wwww.griffithobservatory.com',
      lat: 34.1184341,
      long: -118.3025875
    },
    { loc: 'Hollywood Walk of Fame',
      url: 'http://www.walkoffame.com',
      lat: 34.101285,
      long: -118.3443718
    },
    { loc: 'Santa Monica Pier',
      url: 'http://www.santamonicapier.org',
      lat: 34.0092419,
      long: -118.4997977
    },
    { loc: 'Los Angeles County Museum of Art',
      url: 'http://www.lacma.org',
      lat: 34.0639323,
      long: -118.3614233
    },
    { loc: 'Cathedral of Our Lady of the Angels',
      url: 'http://www.olacathedral.org',
      lat: 34.0577215,
      long: -118.2471888
    },
    {
      loc: 'Ronald Reagan Presidential Library',
      url: 'https://www.reaganfoundation.org',
      lat: 34.2598671,
      long: -118.8219969
    },
    {
      loc: 'Huntington Library',
      url: 'http://www.huntington.org/',
      lat: 34.1290452,
      long: -118.1167129
    },
    {
      loc: 'Lake Hollywood Park',
      url: 'http://www.laparks.org/park/lake-hollywood',
      lat: 34.127035,
      long: -118.3281227
    },
    {
      loc: 'Los Angeles Zoo',
      url: 'http://www.lazoo.org/',
      lat: 34.1483926,
      long: -118.2862767
    },
    {
      loc: 'Natural History Museum of Los Angeles County',
      url: 'https://www.nhm.org/site/',
      lat: 34.0169567,
      long: -118.290959
    },
    {
      loc: 'J. Paul Getty Museum',
      url: 'http://www.getty.edu/museum',
      lat: 34.0780358,
      long: -118.4762841
    },
    {
      loc: 'Disneyland',
      url: 'https://disneyland.disney.go.com/',
      lat: 33.8120918,
      long: -117.9211629
    },
    { loc: 'Descanso Gardens',
      url: 'https://www.descansogardens.org',
      lat: 34.2012661,
      long: -118.2119937
    },
    { loc: 'Madame Tussauds Hollywood',
      url: 'https://www2.madametussauds.com/hollywood/en',
      lat: 34.101712,
      long: -118.343729
    }];

    /* generates initial ko.observable array places */
    function placeDestinations() {
      for (var i = 0; i < attractions.length ; i++ ) {
        self.places.push(new Placed(attractions[i].loc, attractions[i].url, attractions[i].lat, attractions[i].long));
      }  
    }

    /* filters displayed table list */
    self.filterList = function() {
      var searchReg = new RegExp(self.searchWord(), 'i');
      self.places().length = 0;
      attractions.forEach(function(data) {
        var str = data.loc.toLowerCase();
        var test = searchReg.test(str);
        if (test) {
          self.places.push(new Placed(data.loc, data.url, data.lat, data.long));
        }
      });
      markers.forEach(function(placedMarker) {
        placedMarker.setMap(null);
      });
      self.updateMarkers();
    };

    /* gets Wikipedia entry */
    function getWiki(name) {
      var u = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + name + '&limit=1&namespace=0&format=jsonfm';
      $.ajax({
        url: u,
        type: 'GET',
        dataType: 'jsonp',
        data: {
            format: 'json'
        },
      }).done(function(data) {
        console.log(data);
        var content = data[2][0];
        var link = data[3][0];
        content = content ? content + '<br><small><a href="' + link + '">read more in wikipedia</a></small>' : '';
        $('#info').css('display', 'block')
        $('#info #content').html(content);
      }).fail(function() {
        alert('Error getting Wiki results');     
      });
    }

    function getYelp(name) {
      // Yelp API ajax
      $.ajax({
        url: 'https://la-attractions.herokuapp.com/' + name,
        method: 'GET',
        dataType: 'json'
      }).done(function(results) {
        $('.loader').addClass('hide');
        var r = results.businesses[0]
        console.log(r);
        var phone = r.display_phone;
        phone = phone ? ('<a href="tel:' + phone + '">' + phone + '</a>') : '';
        var address = r.location.display_address.join('<br>');
        address = address ? address : '';
        var yelp = '<img src="' + r.rating_img_url + '"><br><a href="' + r.url + '">read Yelp reviews</a>';
        $('#info #image').html('<img src="' + r['image_url'] + '" class="business_img">');
        $('#address').html(address);
        $('#yelp').html(yelp);
        $('#phone').html(phone);
      }).fail(function(err) {
        console.log(err);
      });
    }

    function getWeather() { // Gets current weather in Los Angeles in fahrenheit from Openweather API
      $.get('http://api.openweathermap.org/data/2.5/weather?q=Los Angeles,CA&appid=f6528aa612e42b74b4f7bcf00cd1b0b1').done(function(data){
        var temp = (1.8 * (data.main.temp - 273)) + 32; // convert Kelvin to Fahrenheit
        var fTemp = Math.round(temp);
        self.losAngelesWeather(fTemp);
      }).fail(function() {
        self.losAngelesWeather('Error: failed to get temperature');
      });
    }

    function getHelp() {
      $('#info').css('display', 'inline-block');
      var helpContent = '<div class="smScreen">These are the top places to go to, click on <strong>Get Info</strong> to get more info</div>' +
          '<div class="lgScreen">These are the top attractions, click on them to get more info</div>' +
          '<hr>';
      $('#help').html('<h2>Welcome to L.A.</h2>' + helpContent);
    }

    getHelp();
    getWeather();

    var infowindowArr = [];
    var markers = [];
    var markersPlaces = [];
    var map;
    var service;
    var infowindow;
    var losAngeles = new google.maps.LatLng(34.052,-118.243);
    var goldStarIcon = {
      path: 'M 125,5 155,90 245,90 175,145 200,230 125,180 50,230 75,145 5,90 95,90 z',
      fillColor: 'yellow',
      fillOpacity: 0.8,
      scale: 0.1,
      strokeColor: '#e38a56',
      strokeWeight: 1
    };

    (function() {
      $("#close").click(function() {
        $('#info').css('display', 'none');
      });
    }())

    /* Initializes google Map first */
    function initialize() {
      map = new google.maps.Map(document.getElementById('map'), {
          center: losAngeles,
          zoom: 10,
          zoomControl: true,
          styles: mapStyle
        });
    }

    // Change background color of selected name
    function changeBackground(name) {
      // close info
      $('#info').css('display', 'none');

      var allTableCells = document.getElementsByTagName('td');
        for (var i = 0, max = allTableCells.length; i < max; i++) {
            var node = allTableCells[i];

            var currentText = node.childNodes[0].nodeValue;

            if (currentText === name) {
              node.style.backgroundColor = '#e78e56';
            } else {
              node.style.backgroundColor = 'white';
            }
        }
    }

    /* Sets the boundaries of the map based on pin locations */
    window.mapBounds = new google.maps.LatLngBounds();

    window.addEventListener('resize', function(e) {
      /* Makes sure the map bounds get updated on page resize */
      map.fitBounds(mapBounds);
      map.setZoom(10);
      map.setCenter(losAngeles);
    });

    initialize();

    /* Zoom out button */
    self.zoomOut = function() {
      map.setZoom(10);
      map.setCenter(losAngeles);
    };

    /* Adds a marker to the map by query */
    self.addMarker = function(name, url, lati, long) {
      var request = {
        location: losAngeles,
        radius: '1000',
        query: name
      };    

      function callback(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            addMarker(results[i]);
          }
        }
      }
      
      var content = '<h5>' + name + '</h5>';
      var infowindow = new google.maps.InfoWindow({
        content: content,
        maxWidth: 200
      });
      var myLatLng = {lat: lati, lng: long};
      var marker = new google.maps.Marker({
        map: map,
        animation: google.maps.Animation.DROP,
        position: myLatLng,
        icon: goldStarIcon,
        title: content
      });

      markers.push(marker);
      markersPlaces.push(name);
      infowindowArr.push(infowindow);

      marker.addListener('click', function(e) {
        /* Closes all infowindows first */
        var closeInfoWindow = function() {
          self.showButton(false);
          infowindowArr.forEach(function(x) {
           x.close();
          });
        };
        closeInfoWindow();
        /* Clicking anywhere in the map also calls closeInfoWindow */
        google.maps.event.addListener(map, 'click', closeInfoWindow);

        // Open info window
        infowindow.open(map, marker);
        if (marker.getAnimation() !== null) {
          marker.setAnimation(null);
        } else {
          markers.forEach(function(x, y) {
            x.setAnimation(null);
          });
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }
        var title = $(this.getTitle()),
            titleText = title.text();
        document.getElementById('optionVal').value = titleText;

        if ($(window).width() > 768) {
          $('.info, #help').html('');
          $('.loader').removeClass('hide');
          getWiki(titleText);
          getYelp(titleText);
        }

        changeBackground(titleText);
        self.showButton(false);
      });
    }; // end self.mark

    /* Gets wiki,yelp info displays it in hidden modal, closes other infoWindows and bounces current marker */
    self.viewIt = function(name) {
      $('.info, #help').html('');
      $('.loader').removeClass('hide');
      getWiki(name);
      getYelp(name);

      var ind = markersPlaces.indexOf(name);
      map.setCenter(markers[ind].getPosition());
      // map.setZoom(15);
      infowindowArr.forEach(function(x) {
        x.close();
      });
      infowindowArr[ind].open(map, markers[ind]);
      markers.forEach(function(x) {
        x.setAnimation(null);
      });
      markers[ind].setAnimation(google.maps.Animation.BOUNCE);
      $('#info').css('display', 'inline-block');
    };

    // view place name
    var view = function(name) {
      self.viewIt(name);
    }

    /* clicking place name on the table list cell invokes this function */
    self.viewMarker = function() {
      var viewedName = this.name();
      view(viewedName);
      changeBackground(viewedName);
    };

    /* clicking place name on the options list invokes this function */
    self.viewMarkerOptions = function() {
      var viewedName = $('#optionVal').val()
      view(viewedName);
      changeBackground(viewedName);
    }

    /* Adds all items in attractions array to self.places ko.observable(array) 
     * by default
    */
    placeDestinations();

    /* Places markers on map based on current self.places ko.observable(array) */
    self.updateMarkers = function() {
      self.places().forEach(function(data, index) {
          self.addMarker(data.name(), data.url(), data.lat(), data.long());
      });
    };

    /* by default place all markers */
    self.updateMarkers();
  }

  ko.applyBindings(new appViewModel()); // start app
}

function googleError() {
  function errorViewModel() {
    this.titleMsg = ko.observable('Sorry, Error loading Map !');
  }

  ko.applyBindings(new errorViewModel());
}