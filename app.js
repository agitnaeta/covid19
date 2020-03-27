const OUR_COUNTRY = 'indonesia';
const DEFAULT_LOCATION = {
    lat :-6.8586102 ,
    lng : 107.9163895
}
$(document).ready(function(){
    autoUpdate()    
    $('#your_location').html(`<h3>Loading....</h3>`)
    $.get('https://covid19-public.digitalservice.id/analytics/longlat/',
    function(response){
        
       run(response)
        
    })
})

function run(response){
    navigator.geolocation.getCurrentPosition((location)=>{
        let our_location = {
            lat : location.coords.latitude,
            lng : location.coords.longitude
        }
        $('#last_update').html(response.last_update)
        localStorage.setItem('data',JSON.stringify(response))
        autodetect(our_location,response.data,'Kasus terdekat berdasar auto detect')
        map(response.data,our_location)
        
    },(error)=>{
        $('#your_location').html(`<h3> Device anda tidak mengizinkan / terjadi kesalahan.
        <p> <a href="https://github.com/agitnaeta/covid19/issues/new" target="_top">
        Laporkan Bug
            </a></p>
        </h3>`)
    },{
        enableHighAccuracy:true
    });
}

function map(data,loc){
    let mainMap = L.map('mapid').setView([loc.lat,loc.lng], 15);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(mainMap);

    createMarker(data,mainMap)
    createMiddleMarker(loc,mainMap)
    background()
	mainMap.on('click', detect);
    return mainMap
}

function createMiddleMarker(location,mainMap){
    L.marker([
        location.lat,
        location.lng
    ],{
        icon : blackIcon
    })
    .addTo(mainMap);
}
function createMarker(data,mainMap){
    data.map((value,index)=>{   
       if(value.alamat_longitude!=null){
        L.marker([
            value.alamat_latitude,
            value.alamat_longitude
        ],{
            icon : detectStatus(value.status)
        })
        .addTo(mainMap);
       }
    })
}

function detectStatus(status){
    let color = {
        ODP: blueIcon,
        PDP: yellowIcon,
        Positif: redIcon,
    }
    return color[status]
}

function findLocation(){
    let city = $("#location").val()
    if(city.length > 3){
        $.get('https://nominatim.openstreetmap.org/search?city='+city+'&country=indonesia&format=json',
        async function(data){
           // get the first record 
           if(data.length>0 && data[0]!==undefined){
               let location_search =  {
                    lat : data[0].lat,
                    lng : data[0].lon,
                }
                let jsonData = JSON.parse(localStorage.getItem('data')).data

                await $('.canva').html('')
                await $('.canva').html(`<div id="mapid" class='main-maps' style='height:300px;width:100%'></div>`)
                await map(jsonData,location_search)
                await autodetect(location_search,jsonData,'Kasus terdekat bedasar pusat kota')
               
           }
        })
    }
    else{
        alert('Lokasi tidak valid')
    }
}
function detect(e){    
    let jsonData = JSON.parse(localStorage.getItem('data')).data
    autodetect(e.latlng,jsonData,'Kasus terdekat berdasar lokasi yang anda Klik')
}

function autodetect(location,data,text=''){
    let arr  = data.map((value)=>{
       let distance = getDistanceBetweenPoints(location,{
        lat : value.alamat_latitude,
        lng : value.alamat_longitude
       })
       return (distance / 1000)
    })
    $('#your_location').html(`<h3> ${text}</h3><h1>${arr.sort()[0].toFixed(2)} Km</h1>`)
}

/**
 * Converts degrees to radians.
 * 
 * @param degrees Number of degrees.
 */
function degreesToRadians(degrees){
    return degrees * Math.PI / 180;
}


function getDistanceBetweenPoints(center, target){
// The radius of the planet earth in meters
    let R = 6378137;
    let dLat = degreesToRadians(target.lat - center.lat);
    let dLong = degreesToRadians(target.lng - center.lng);
    let a = Math.sin(dLat / 2)
            *
            Math.sin(dLat / 2) 
            +
            Math.cos(degreesToRadians(center.lat)) 
            * 
            Math.cos(degreesToRadians(center.lat)) 
            *
            Math.sin(dLong / 2) 
            * 
            Math.sin(dLong / 2);

    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let distance = R * c;
    return distance;
}

function background(){
    setTimeout(async ()=>{
       if(localStorage.getItem('auto_update')==='1'){
            let jsonData = JSON.parse(localStorage.getItem('data'))
            await $('.canva').html(`<div id="mapid" class='main-maps' style='height:300px;width:100%'></div>`)
            run(jsonData)
       }
       else{
           background()
           console.log('detect')
       }
    },3000)
}

function autoUpdate(){
    $('#auto_update').click(function(){
        if($(this).is(':checked')){
            localStorage.setItem('auto_update',1)
            $(this).prop('checked',true)
        }
        else{
            localStorage.setItem('auto_update',0)
            $(this).removeAttr('checked')
        }
    })
}