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
    self.searchWord = ko.observable();
    self.showButton = ko.observable(false);

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

    function checkWikiExistence(name, arr) {
      return arr.some(function(el) {
        return el[0] === name;
      });
    }

    function displayWiki(data) {
      console.log(data);
      var content = data[2][0];
      var link = data[3][0];
      content = content ? content + '<br><small><a href="' + link + '">read more in wikipedia</a></small>' : '';
      $('.wiki').css('display', 'block')
      $('#info #content').html(content);
    }

    /* gets Wikipedia entry */
    var wikiData = [];
    function getWiki(name) {
      var wikiCheck = checkWikiExistence(name, wikiData);
      if (wikiCheck) {
        var data;
        wikiData.forEach(function(e) {
          if (e[0] === name) {
            data = e; 
          }
        });
        displayWiki(data);
        return
      }
      var u = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + name + '&limit=1&namespace=0&format=jsonfm';
      $.ajax({
        url: u,
        type: 'GET',
        dataType: 'jsonp',
        data: {
            format: 'json'
        },
      }).done(function(data) {
        displayWiki(data);
        wikiData.push(data);
      }).fail(function() {
        alert('Error getting Wiki results');     
      });
    }

    // Gets Yelp API from a heroku app
    var yelpData = [];
    function checkYelpExistence(name, arr) {
      return arr.some(function(el) {
        return el.businesses[0].name === name;
      });
    }

    function displayYelp(results) {
      $('.loader').addClass('hide');
      var r = results.businesses[0]
      console.log(r);
      var phone = r.display_phone;
      phone = phone ? ('<a href="tel:' + phone + '">' + phone + '</a>') : '';
      var address = r.location.display_address.join('<br>');
      var gmapsAddress = r.location.display_address.join('+');
      var gmaps = '<a href="http://maps.google.com/?daddr=' + gmapsAddress + '" target="_blank">';
      address = address ? (gmaps + address + '</a>') : '';
      var yelp = '<img src="' + r.rating_img_url + '"><br><a href="' + r.url + '">read Yelp reviews</a>';
      $('#image').html('<img src="' + r['image_url'] + '" class="business_img">').css('display','block');
      $('#address').html(address).css('display', 'inline-block');
      $('#yelp').html(yelp).css('display', 'inline-block');
      $('#phone').html(phone).css('display', 'block');
    }

    function getYelp(name) {
      // Yelp API ajax
      var yelpCheck = checkYelpExistence(name, yelpData);
      if (yelpCheck) {
        var data;
        yelpData.forEach(function(e) {
          if (e.businesses[0].name === name) {
            data = e;
          }
        });
        displayYelp(data);
        return;
      }
      $.ajax({
        url: 'https://la-attractions.herokuapp.com/' + name,
        method: 'GET',
        dataType: 'json'
      }).done(function(results) {
        displayYelp(results)
        yelpData.push(results);
        console.log('yelp')
        console.log(yelpData);
      }).fail(function(err) {
        console.log(err);
      });
    }

    // Gets Openweather API results
    function getWeather() { // Gets current weather in Los Angeles in fahrenheit from Openweather API
      $.get('http://api.openweathermap.org/data/2.5/weather?q=Los Angeles,CA&appid=f6528aa612e42b74b4f7bcf00cd1b0b1').done(function(data){
        var temp = (1.8 * (data.main.temp - 273)) + 32; // convert Kelvin to Fahrenheit
        var fTemp = Math.round(temp);
        self.losAngelesWeather(fTemp);
      }).fail(function() {
        self.losAngelesWeather('Error: failed to get temperature');
      });
    }

    // Shows Instructions and Welcome screen
    function getHelp() {
      $('#info, .weatherInfo').css('display', 'inline-block');
      var helpContent = 'These are the top attractions, click on them to get more info</div>' +
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

    // Close button on info event handler
    $("#close").click(function() {
      $('#info, .weatherInfo').css('display', 'none');
    });

    /* Initializes google Map first */
    function initialize() {
      map = new google.maps.Map(document.getElementById('map'), {
          center: losAngeles,
          zoom: 10,
          zoomControl: true,
          styles: mapStyle
        });
    }

    // Change table background color of selected name
    function changeBackground(name) {
      // close info
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

      // add Event Listener click
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
          view(titleText);          
        }
      });
    }; // end self.mark

    /* Gets wiki,yelp info displays it in hidden modal, closes other infoWindows and bounces current marker */
    self.viewIt = function(name) {
      $('.weatherInfo, #help').css('display', 'none');
      $('.yelp, .wiki').css('display','none');
      $('.loader').removeClass('hide');
      getWiki(name);
      getYelp(name);
      changeBackground(name);

      // get url
      var url;
      attractions.forEach(function(e) {
        if (e.loc === name) {
          return url = e.url;
        }
      });
      $('#url').css('display', 'inline').attr('href', url);

      var ind = markersPlaces.indexOf(name);
      // center map
      map.setCenter(markers[ind].getPosition());
      // close all other info windows
      infowindowArr.forEach(function(x) {
        x.close();
      });
      // open clicked marker's info window
      infowindowArr[ind].open(map, markers[ind]);
      // turn off all other bounce animations
      markers.forEach(function(x) {
        x.setAnimation(null);
      });
      // bounce animation
      markers[ind].setAnimation(google.maps.Animation.BOUNCE);
      $('#info').css('display', 'inline-block').css('visibility', 'visible');
      $('.weatherInfo').css('display', 'none');
    };

    // view place name
    var view = function(name) {
      self.viewIt(name);
    }

    /* clicking place name on the table list cell invokes this function */
    self.viewMarker = function() {
      var viewedName = this.name();
      view(viewedName);
    };

    /* clicking place name on the options list invokes this function */
    self.viewMarkerOptions = function() {
      var viewedName = $('#optionVal').val()
      view(viewedName);
    }

    /* Adds all items in attractions array to self.places ko.observable(array) 
     * by default
    */
    placeDestinations();

    // add Google markers
    self.places().forEach(function(data, index) {
        self.addMarker(data.name(), data.url(), data.lat(), data.long());
    });
  }

  ko.applyBindings(new appViewModel()); // start app
}

function googleError() {
  function errorViewModel() {
    this.titleMsg = ko.observable('Sorry, Error loading Map !');
  }

  ko.applyBindings(new errorViewModel());
}