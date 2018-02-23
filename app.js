const main = document.getElementById('main');
const zipInput = document.getElementById('zip');
let gMap;
let issMarker;

// FETCH
function fetchData(url, opts = {}) {
    return fetch(url, opts)
        .then(checkStatus)
        .then(res => res.json())
        .catch(err => console.log('An error occurred fetching the data', err))
}

// HELPERS
function checkStatus(res) {
    if(res.ok) {
        return Promise.resolve(res)
    } else {
        return Promise.reject(new Error(res.statusText))
    }
}

// API CALLS
function getCityLocation() {
    return new Promise( (resolve, reject) => {
        const value = parseInt(zipInput.value);
        fetchData(`https://maps.googleapis.com/maps/api/geocode/json?address=${value}&key=AIzaSyDtGY_ggAfbD0x7FKt2hic4pTBhBz9Rkac`)
            .then(data => {
                if(data.results.length) {
                    const coords = data.results[0].geometry.location;
                    const address = { address: data.results[0].formatted_address }
                    const location = Object.assign({}, coords, address);
                    resolve( location );
                }
                reject(data)
            })
    })
}

function getISSLocations(coords) {
    const proxy = 'https://cors-anywhere.herokuapp.com/';
    const url = `${proxy}http://api.open-notify.org/iss-pass.json?lat=${coords.lat}&lon=${coords.lng}&alt=10&n=5`;
    fetchData(url)
        .then(data => addTravelTimes(data.response) )
}

function getCurrentISSLocation() {
    return new Promise((resolve, reject) => {
        fetchData('http://api.open-notify.org/iss-now.json')
            .then(data => {
                resolve(data.iss_position);
            })
    })
}

function initMap() {
    const map = document.getElementById('map');
    getCurrentISSLocation()
        .then(coords => {
            const issLocation =  {
                lat: parseFloat(coords.latitude),
                lng: parseFloat(coords.longitude)
            }

            gMap = new google.maps.Map(map, {
                zoom: 6,
                center: issLocation,
                mapTypeId: 'hybrid'
            });

            var image = 'http://www2.artcenter.edu/dot/archive/images/dotLogo_OrangeDot.png';
            issMarker = new google.maps.Marker({
                position: issLocation,
                map: gMap
            });
        })
}

function moveISSLocation() {
    getCurrentISSLocation()
        .then(coords => {
            const issLocation =  {
                lat: parseFloat(coords.latitude),
                lng: parseFloat(coords.longitude)
            }
            issMarker.setPosition( new google.maps.LatLng( issLocation ) );
            gMap.panTo( new google.maps.LatLng( issLocation ) );
        })
};

initMap()
setInterval(() => {
    moveISSLocation()
}, 1000)


// DOM EVENTS
function placeISSMarker() {

}
function showISSTimes() {
    const h1 = document.querySelector('h1');

    getCityLocation()
        .then(data => {
            h1.textContent = data.address;
            getISSLocations(data);
        })
        .catch(err => {
            if(err.status == 'ZERO_RESULTS') {
                h1.textContent = 'Please choose a valid US zip code';
            } else {
                h1.textContent = 'Something when wrong. Please try again';
            }
        });
}

function addTravelTimes(times) {
    const ul = document.querySelector('ul');
    ul.innerHTML = '';
    times.forEach(time => {
        let dateTime = new Date(time.risetime * 1000);

        let startTime = dateTime.toLocaleTimeString();
        let timeLapse = dateTime.setSeconds( dateTime.getSeconds() + time.duration );
        let endTime = new Date(timeLapse).toLocaleTimeString();

        let li = document.createElement('li');
        li.innerHTML = `
            <p>${dateTime.toDateString()}: 
                <span>start: ${startTime} - end: ${endTime}</span>
            </p>
        `;
        ul.appendChild(li);
    });
}

// EVENT LISTENERS
zipInput.addEventListener('keyup', (e) => {
    if(e.target.value && e.target.value.length == 5) {
        showISSTimes();
    }
});

