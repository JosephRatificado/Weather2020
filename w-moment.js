$(document).ready(function () {
    mapboxgl.accessToken =
        "pk.eyJ1Ijoid2VhdGhlcjIwMjBsbGMiLCJhIjoiY2xuOTNuMmtxMDI3cTJqbWdmM2h6d2theSJ9.sLvJwJQsMxtNl-dH0tew7A";

    let defaultLat = 38.984764;
    let defaultLon = -94.677658;

    let latitude = defaultLat;
    let longitude = defaultLon;

    let clickedLat = null;
    let clickedLong = null;

    let openPopup = null;
    let clickedLocationMarkerAdded = false;
    let isToggled;

    var map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [defaultLon, defaultLat],
        zoom: 6,
    });

    map.on("style.load", () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
                clickedLong = longitude;
                clickedLat = latitude;
                // Show preloader
                $(".preloader").fadeIn("fast");
                fetchData(clickedLat, clickedLong, "tmax", temperatureUnit);
                map.addSource("user-location", {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [longitude, latitude],
                        },
                        properties: {
                            locationName: "User Location",
                        },
                    },
                });

                map.addLayer({
                    id: "user-location-marker",
                    type: "circle",
                    source: "user-location",
                    paint: {
                        "circle-radius": 8,
                        "circle-stroke-width": 1,
                        "circle-color": "#138eff",
                        "circle-opacity": 1,
                        "circle-stroke-color": "white",
                    },
                });

                map.setCenter([longitude, latitude]);

                const geocoderUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxgl.accessToken}`;

                fetch(geocoderUrl)
                    .then((response) => response.json())
                    .then((data) => {
                        const features = data.features;
                        if (features.length > 0) {
                            const locationName = features[0].place_name;
                            map.getSource("user-location").setData({
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [longitude, latitude],
                                },
                                properties: {
                                    locationName: locationName,
                                },
                            });
                        }
                    })
                    .catch((error) =>
                        console.error("Error getting location name:", error)
                    );
            },
            (error) => {
                console.error("Error getting location:", error.message);
                clickedLat = defaultLat;
                clickedLong = defaultLon;
                // Show preloader
                $(".preloader").fadeIn("fast");
                fetchData(defaultLat, defaultLon, "tmax", temperatureUnit);

                map.addSource("default-location", {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [defaultLon, defaultLat],
                        },
                        properties: {
                            locationName: "12758 Bond Street Overland Park, KS 66213",
                        },
                    },
                });

                map.addLayer({
                    id: "default-location-marker",
                    type: "circle",
                    source: "default-location",
                    paint: {
                        "circle-radius": 8,
                        "circle-stroke-width": 1,
                        "circle-color": "#FFC700",
                        "circle-opacity": 1,
                        "circle-stroke-color": "white",
                    },
                });

                map.on("mouseleave", "default-location-marker", function () {
                    map.getCanvas().style.cursor = "";
                    if (openPopup) {
                        openPopup.remove();
                        openPopup = null;
                    }
                });

                map.on("mouseenter", "default-location-marker", function (e) {
                    map.getCanvas().style.cursor = "pointer";

                    const coordinates = e.features[0].geometry.coordinates.slice();
                    const locationName = e.features[0].properties.locationName;

                    if (openPopup) {
                        openPopup.remove();
                        openPopup = null;
                    }

                    const popup = new mapboxgl.Popup({
                        closeButton: false,
                        closeOnClick: false,
                    })
                        .setLngLat(coordinates)
                        .setHTML(`<p>${locationName}</p>`)
                        .addTo(map);

                    openPopup = popup;
                });

                map.on("click", "default-location-marker", function (e) {
                    clickedLat = defaultLat;
                    clickedLong = defaultLon;
                    $(".preloader").fadeIn("fast");
                    fetchData(defaultLat, defaultLon, "tmax", temperatureUnit);
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    });

    map.on("mouseenter", "user-location-marker", function (e) {
        map.getCanvas().style.cursor = "pointer";

        const coordinates = e.features[0].geometry.coordinates.slice();
        const locationName = e.features[0].properties.locationName;

        clickedLat = coordinates[1];
        clickedLong = coordinates[0];
        if (openPopup) {
            openPopup.remove();
            openPopup = null;
        }

        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
        })
            .setLngLat(coordinates)
            .setHTML(`<p>${locationName}</p>`)
            .addTo(map);

        openPopup = popup;
    });

    map.on("mouseleave", "user-location-marker", function () {
        map.getCanvas().style.cursor = "";
        if (openPopup) {
            openPopup.remove();
            openPopup = null;
        }
    });

    map.on("click", "user-location-marker", function () {
        // Show preloader
        $(".preloader").fadeIn("fast");
        fetchData(clickedLat, clickedLong, "tmax", temperatureUnit);
    });

    map.on("click", function (e) {
        if (!openPopup) {
            const coordinates = e.lngLat.toArray();

            if (map.getSource("clicked-location")) {
                map.removeLayer("clicked-location-marker");
                map.removeSource("clicked-location");
            }

            clickedLat = coordinates[1];
            clickedLong = coordinates[0];

            // $(".preloader").fadeIn("fast");
            // fetchData(clickedLat, clickedLong, "tmax", temperatureUnit);
            map.addSource("clicked-location", {
                type: "geojson",
                data: {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: coordinates,
                    },
                    properties: {
                        locationName: "Clicked Location",
                    },
                },
            });

            map.addLayer({
                id: "clicked-location-marker",
                type: "circle",
                source: "clicked-location",
                paint: {
                    "circle-radius": 8,
                    "circle-stroke-width": 1,
                    "circle-color": "#138eff",
                    "circle-opacity": 1,
                    "circle-stroke-color": "white",
                },
            });

            const geocoderUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxgl.accessToken}`;

            fetch(geocoderUrl)
                .then((response) => response.json())
                .then((data) => {
                    const features = data.features;
                    if (features.length > 0) {
                        const locationName = features[0].place_name;
                        map.getSource("clicked-location").setData({
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: coordinates,
                            },
                            properties: {
                                locationName: locationName,
                            },
                        });
                    }
                })
                .catch((error) =>
                    console.error("Error getting location name:", error)
                );
        }
    });

    const apiKey = "4a104dda79281ab49bc8dd46a25674e5";
    const temperatureUnit = "imperial"; // Options: "standard", "metric", "imperial"

    const svgLinks = {
        tmax: "https://uploads-ssl.webflow.com/653b0216cc0c5e60418f5f63/6548b7f1267",
        tmin: "https://uploads-ssl.webflow.com/653b0216cc0c5e60418f5f63/6548b7f1267",
    };

    const fetchData = async (lat, long, weatherType, unit) => {
        try {
            const weatherResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&exclude=hourly,minutely&appid=${apiKey}&units=${unit}`
            );
            const weatherData = await weatherResponse.json();

            const { daily } = weatherData;

            const weatherArray = daily.map((day) => {
                const date = moment.unix(day.dt).format("YYYY-MM-DD");
                return {
                    date,
                    temperature: day[weatherType],
                };
            });

            renderCalendar(weatherArray);
        } catch (error) {
            console.error("Error fetching weather data:", error);
        }
    };

    const renderCalendar = (weatherArray) => {
        const calendarContainer = document.getElementById("calendar");

        calendarContainer.innerHTML = "";

        weatherArray.forEach((day) => {
            const date = moment(day.date).format("MMM D");
            const temperature = Math.round(day.temperature);
            const weatherIcon = getWeatherIcon(day.temperature);

            const dayElement = document.createElement("div");
            dayElement.classList.add("day");
            dayElement.innerHTML = `
                <div class="date">${date}</div>
                <div class="temperature">${temperature}°</div>
                <img class="weather-icon" src="${weatherIcon}" alt="Weather Icon">
            `;
            calendarContainer.appendChild(dayElement);
        });
    };

    const getWeatherIcon = (temperature) => {
        // Here you can add logic to choose weather icons based on the temperature or weather condition
        // For simplicity, I'm just returning a static weather icon URL
        return svgLinks.tmax; // You can replace this with dynamic logic based on temperature
    };

    fetchData(defaultLat, defaultLon, "temp", "imperial"); // Fetch weather data on initial load
});
