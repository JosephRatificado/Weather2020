$(document).ready(function () {
    // Weather Calendar Setup
    // Declare global variables for default and clicked latitude and longitude
    let defaultLat = 55.57150787492472;
    let defaultLon = -105.74270194960505;
    let clickedLat = defaultLat;
    let clickedLong = defaultLon;
  
    //-----------MAPBOX SETUP CODE BELOW-----------
  
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!! REPLACE ACCESS TOKEN WITH YOUR OWN HERE !!!
    mapboxgl.accessToken =
      "pk.eyJ1Ijoid2VhdGhlcjIwMjBsbGMiLCJhIjoiY2xuOTNuMmtxMDI3cTJqbWdmM2h6d2theSJ9.sLvJwJQsMxtNl-dH0tew7A";
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  
    // create empty locations geojson object
    const mapLocations = {
      type: "FeatureCollection",
      features: []
    };
  
    // Initialize map and load in #map wrapper
    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      zoom: 6,
      center: [-122.420431, 37.779108],
      projection: "globe"
    });
  
    // Adjust zoom of map for mobile and desktop
    const mq = window.matchMedia("(min-width: 480px)");
    map.setZoom(mq.matches ? 6 : 8);
    // set map zoom level for desktop size (6)
    // set map zoom level for mobile size (8)
  
    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());
  
    // Get cms items
    const listLocations = document.getElementById("location-list").childNodes;
  
    // For each colleciton item, grab hidden fields and convert to geojson proerty
    const getGeoData = () => {
      Array.from(listLocations).forEach((location) => {
        const locationLat = location.querySelector("#locationLatitude").value;
        const locationLong = location.querySelector("#locationLongitude").value;
        const locationName = location.querySelector("#locationName").value;
        const locationID = $(location).find("#locationID").val();
        const coordinates = [locationLong, locationLat];
  
        const geoData = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates
          },
          properties: {
            id: locationID,
            description: locationName
          }
        };
  
        if (!mapLocations.features.includes(geoData)) {
          mapLocations.features.push(geoData);
        }
      });
    };
  
    // Invoke function
    getGeoData();
  
    // Define mapping function to be invoked later
    const addMapPoints = () => {
      // Initial fetch with default lat and lon
      fetchData(defaultLat, defaultLon, "tmax", temperatureUnit); // default location San Francisco California Usa
      /* Add the data to your map as a layer */
      map.addLayer({
        id: "locations",
        type: "circle",
        /* Add a GeoJSON source containing place coordinates and information. */
        source: {
          type: "geojson",
          data: mapLocations
        },
        paint: {
          "circle-radius": 8,
          "circle-stroke-width": 1,
          "circle-color": "#FFC700",
          "circle-opacity": 1,
          "circle-stroke-color": "white"
        }
      });
  
      // When a click event occurs on a feature in the places layer, open a popup at the
      // location of the feature, with description HTML from its properties.
      map.on("click", "locations", (e) => {
        // Show preloader
        $(".preloader").fadeIn("fast");
        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.description;
        clickedLong = e.lngLat.lng;
        clickedLat = e.lngLat.lat;
  
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
  
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map);
        // $("#loc-map").text(description);
        fetchData(clickedLat, clickedLong, "tmax", temperatureUnit); // Call fetchData with the clicked coordinates
      });
  
      // Center the map on the coordinates of any clicked circle from the 'locations' layer.
      map.on("click", "locations", (e) =>
        map.flyTo({
          center: e.features[0].geometry.coordinates,
          speed: 0.5,
          curve: 1,
          easing: (t) => t
        })
      );
    };
  
    // Change the cursor to a pointer when the mouse is over the 'locations' layer.
    map.on(
      "mouseenter",
      "locations",
      () => (map.getCanvas().style.cursor = "pointer")
    );
  
    // Change it back to a pointer when it leaves.
    map.on("mouseleave", "locations", () => (map.getCanvas().style.cursor = ""));
  
    // When map is loaded initialize with data
    map.on("load", () => {
      // Check if the Geolocation API is available
      if (navigator.geolocation) {
        // Get the current position
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Update defaultLat and defaultLon with the current location
            defaultLat = position.coords.latitude;
            defaultLon = position.coords.longitude;
  
            clickedLong = defaultLon;
            clickedLat = defaultLat;
  
            // Call addMapPoints with updated defaultLat and defaultLon
            addMapPoints();
  
            // Center the map on the coordinates of the current location
            map.flyTo({
              center: [defaultLon, defaultLat],
              speed: 1.5,
              curve: 1,
              easing: (t) => t
            });
  
            // Add a marker for the current location
            // Add a marker for the current location
            map.addLayer({
              id: "current-location-marker",
              type: "circle",
              source: {
                type: "geojson",
                data: {
                  type: "FeatureCollection",
                  features: [
                    {
                      type: "Feature",
                      geometry: {
                        type: "Point",
                        coordinates: [defaultLon, defaultLat]
                      },
                      properties: {
                        id: "current-location",
                        description: "Current Location"
                      }
                    }
                  ]
                }
              },
              paint: {
                "circle-radius": 8,
                "circle-stroke-width": 1,
                "circle-color": "#138eff",
                "circle-opacity": 1,
                "circle-stroke-color": "white"
              }
            });
  
            // Set up a click event listener for the current location marker
            map.on("click", "current-location-marker", () => {
              // Show preloader
              $(".preloader").fadeIn("fast");
              // Call fetchData with the clicked coordinates
              fetchData(defaultLat, defaultLon, "tmax", temperatureUnit);
            });
  
            map.on(
              "mouseenter",
              "current-location-marker",
              () => (map.getCanvas().style.cursor = "pointer")
            );
  
            // Change it back to a pointer when it leaves.
            map.on(
              "mouseleave",
              "current-location-marker",
              () => (map.getCanvas().style.cursor = "")
            );
          },
          (error) => {
            // Handle errors if location retrieval fails
            console.error("Error getting current location:", error);
            // Call addMapPoints with the original defaultLat and defaultLon
            addMapPoints();
          }
        );
      } else {
        // Geolocation is not supported, use the original defaultLat and defaultLon
        addMapPoints();
  
        // Center the map on the initial default coordinates
        map.flyTo({
          center: [defaultLon, defaultLat],
          speed: 0.5,
          curve: 1,
          easing: (t) => t
        });
      }
    });
  
    // ========================================================= //
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const targetMonth =
      currentMonth + 3 > 12 ? currentMonth - 9 : currentMonth + 3;
    const yearForTargetMonth =
      currentMonth + 3 > 12 ? currentYear + 1 : currentYear;
    const startDay = new Date(yearForTargetMonth, targetMonth - 1, 1);
    const endDay = new Date(yearForTargetMonth, targetMonth, 1);
    const apiKey = "4a104dda79281ab49bc8dd46a25674e5";
    const svgLinks = {
      tmax:
        "https://uploads-ssl.webflow.com/653b0216cc0c5e60418f5f63/6548a55e7c01e0d4ecce25dd_arrow_outward.svg",
      tmin:
        "https://uploads-ssl.webflow.com/653b0216cc0c5e60418f5f63/6548b7f1267ff6e0910d0cdc_arrow_downward2.svg",
      snow:
        "https://uploads-ssl.webflow.com/653b0216cc0c5e60418f5f63/654b48fd58d06fc04317d43f_ac_unit.svg",
      prcp:
        "https://uploads-ssl.webflow.com/653b0216cc0c5e60418f5f63/65558630f45bcbd11ab89202_icon-precipitation%20(1).svg"
    };
  
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
  
    const getNormalsData = async (lat, lon, month, year) => {
      const apiUrl = `https://api.weather2020.com/normals?lat=${lat}&lon=${lon}&units=metric&month=${month}&year=${year}`;
  
      return await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey
        }
      })
        .then(async (result) => result.json().then(({ data }) => data))
        .catch((err) => console.error(err));
    };
  
    const getBackgroundColor = (result) => {
      switch (true) {
        case result >= -0.59 && result <= 0.59:
          return "average";
        case result >= 0.6 && result <= 3.39:
          return "above-average";
        case result >= 3.4 && result <= 6.09:
          return "much-above-average";
        case result >= 6.1:
          return "extreme-above-average";
        case result <= -0.6 && result >= -3.39:
          return "below-average";
        case result <= -3.4 && result >= -6.09:
          return "much-below-average";
        case result <= -6.1:
          return "extreme-below-average";
        default:
          return ""; // or handle other cases if needed
      }
    };
  
    let temperatureUnit = "°F";
  
    const toggleTemperatureUnit = () => {
      // Get the state of the checkbox (checked or not)
      const isChecked = $("#temperatureUnitCheckbox").prop("checked");
  
      // Update the temperature unit based on the checkbox state
      temperatureUnit = isChecked ? "°C" : "°F";
      // Show preloader
      $(".preloader").fadeIn("fast");
      // Call fetchData with the updated temperature unit
      fetchData(clickedLat, clickedLong, "tmax", temperatureUnit);
    };
  
    // Attach change event to the temperature unit checkbox
    $("#temperatureUnitCheckbox").on("change", toggleTemperatureUnit);
  
    $("#temperatureUnitButton").on("click", toggleTemperatureUnit);
  
    const fetchData = async (lat, lon, dataType, temperatureUnit) => {
      const apiUrl = `https://api.weather2020.com/forecasts?lat=${lat}&lon=${lon}&units=metric&start_date=${formatDate(
        startDay
      )}&end_date=${formatDate(endDay)}`;
  
      await getNormalsData(lat, lon, targetMonth, yearForTargetMonth).then(
        (fetchResult) => {
          $.ajax({
            url: apiUrl,
            type: "GET",
            beforeSend: (xhr) => xhr.setRequestHeader("X-API-Key", apiKey),
            success: ({ data }) => {
              const calendarContainer = $("#calendar");
              calendarContainer.empty();
              $(".preloader").fadeOut("fast");
              const monthsData = {};
  
              data.forEach((item) => {
                const date = new Date(item.date);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
  
                const key = `${year}-${month < 10 && 0}${month}`;
                if (!monthsData[key]) {
                  monthsData[key] = [];
                }
                monthsData[key].push({
                  day: date.getDate(),
                  tmax: item.tmax,
                  tmin: item.tmin,
                  snow: item.snow,
                  prcp: item.prcp
                });
              });
  
              for (let key in monthsData) {
                if (monthsData.hasOwnProperty(key)) {
                  const yearMonth = key.split("-");
                  const year = parseInt(yearMonth[0]);
                  const month = parseInt(yearMonth[1]);
  
                  if (month === targetMonth && year === yearForTargetMonth) {
                    const monthName = new Date(
                      year,
                      month - 1,
                      1
                    ).toLocaleString("default", { month: "long" });
                    const calendarDays = [
                      "Sun",
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat"
                    ];
                    const daysLength = calendarDays.length;
  
                    const monthTable = $('<table class="month-table"></table>');
                    monthTable.append(
                      `<thead>
                        <tr><th colspan="${daysLength}">${monthName} ${year}</th></tr>
                        <tr>${calendarDays
                          .map((d) => `<th>${d}</th>`)
                          .join("")}</tr>
                      </thead>`
                    );
  
                    const daysInMonth = new Date(year, month, 0).getDate();
                    const firstDay = new Date(year, month - 1, 1).getDay();
                    let dateCounter = 1;
  
                    const tbody = $("<tbody></tbody>");
  
                    // Inside the loop for creating calendar days
                    for (let i = 0; i < daysLength - 1; i++) {
                      const row = $("<tr></tr>");
                      for (let j = 0; j < daysLength; j++) {
                        const updateBg = () => {
                          const cell = $("<td></td>");
                          cell.append(`<div class="date">${dateCounter}</div>`);
                          monthsData[key] &&
                            monthsData[key].forEach((item) => {
                              if (item.day === dateCounter) {
                                const isSnow = dataType === "snow";
                                const isPrcp = dataType === "prcp";
  
                                // Function to determine the background class based on data type
                                const determineBackgroundColor = (normalTmax) => {
                                  if (isSnow) {
                                    return item[dataType] > 0.78
                                      ? "snow-background"
                                      : "transparent";
                                  } else if (isPrcp) {
                                    return item[dataType] > 1.55
                                      ? "prcp-background"
                                      : "transparent";
                                  } else {
                                    
                                    return getBackgroundColor(
                                      item[dataType] - normalTmax
                                    );
                                  }
                                };
  
                                
                                const backgroundColor = determineBackgroundColor(
                                  fetchResult.find(
                                    (fr) =>
                                      fr.day === dateCounter && fr.month === month
                                  )[dataType]
                                );
  
                                const temperatureSymbol =
                                  temperatureUnit === "°C" ? "°C" : "°F";
                                const temperatureValue =
                                  temperatureUnit === "°C"
                                    ? item[dataType].toFixed(1)
                                    : Math.round(item[dataType]);
  
                                cell.append(`<div class="${dataType} ${backgroundColor}">
                                  ${
                                    item[dataType] !== 0
                                      ? `<img src="${svgLinks[dataType]}" alt="arrow" />`
                                      : ""
                                  }
                                  ${
                                    !isSnow && !isPrcp
                                      ? `${temperatureValue}${temperatureSymbol}`
                                      : item[dataType]
                                  }
                                </div>`);
                              }
                            });
  
                          row.append(cell);
                          dateCounter++;
                        };
  
                        i === 0 && j < firstDay
                          ? row.append("<td></td>")
                          : dateCounter <= daysInMonth
                          ? updateBg()
                          : row.append("<td></td>");
                      }
                      tbody.append(row);
                      if (dateCounter > daysInMonth) break;
                    }
                    monthTable.append(tbody);
                    calendarContainer.append(monthTable);
                  }
                }
              }
            },
            error: (_xhr, _status, error) => console.error(error)
          });
        }
      );
    };
  
    // Button click event handlers
    $("#tmaxButton").on("click", function () {
      // Show preloader
      $(".preloader").fadeIn("fast");
      fetchData(clickedLat, clickedLong, "tmax", temperatureUnit);
    });
  
    $("#tminButton").on("click", function () {
      // Show preloader
      $(".preloader").fadeIn("fast");
      fetchData(clickedLat, clickedLong, "tmin", temperatureUnit);
    });
  
    $("#snowButton").on("click", function () {
      // Show preloader
      $(".preloader").fadeIn("fast");
      fetchData(clickedLat, clickedLong, "snow", temperatureUnit);
    });
  
    $("#prcpButton").on("click", function () {
      // Show preloader
      $(".preloader").fadeIn("fast");
      fetchData(clickedLat, clickedLong, "prcp", temperatureUnit);
    });
  });
  
