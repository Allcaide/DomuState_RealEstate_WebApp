export function initMap(containerId, options) {
    const map = L.map(containerId).setView(options.center, options.zoom);
    L.tileLayer(options.tileUrl, options.tileOptions).addTo(map);
    return map;
}

export function addMarker(map, lat, lng, markerOptions = {}) {
    return L.marker([lat, lng], markerOptions).addTo(map);
}