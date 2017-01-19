# Los Angeles Attractions Map

Access the app live at https://la-attractions.herokuapp.com

## Synopsis

Ever wanted to visit Los Angeles, California? Or if you are in L.A. visiting right now, have your ever wanted to see how close you are to the top attractions? 
This app can show you these attractions and more.

## Features

1. Displays the current weather in L.A. from Openweather.
2. Displays Wikipedia API summaries with links to the article in Wikipedia too.
3. Yelp reviews rating with more info for each attractions.
4. Geolocation and distance (Coordinates distance in miles) between your current position and each attraction.
5. Has location address, (also phone number) with link to open in the Google Maps app if you have it in your phone.

## Dependencies
1. Knockout JS for client-side rendering
2. jQuery for AJAX requests
3. Google Maps API
4. Openweather API
5. Yelp API
6. Wikipedia API
7. NodeJS with modules (express, ejs, request, yelp)
8. Twitter bootstrap

NOTE: The backend was used to be able to access Oauth 2.0 with the Yelp API, and serve JSON from the Openweather API which does not have https
			Git repo of this is in : https://github.com/ncabelin/la-backend

![neighbormap](http://cabelin.com/losangelesattractions/images/screenshot2.jpg)

## Instructions

1. Type attraction place in the filter input field and click the search button or hit enter on your keyboard to filter.
2. Click on attraction name in the list to view the attraction in the map for Wikipedia, Yelp info.
3. Click on the marker infowindow's link to visit the wikipedia, yelp, and attraction's website.
4. Determine miles from your current position by clicking 'Get Position'.

## Contributors

Neptune Michael Cabelin

## License

MIT