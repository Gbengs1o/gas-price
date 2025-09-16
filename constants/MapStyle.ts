// This function creates the map style array based on the colors you provide.
export const createMapStyle = (colors: { background: any; water: any; road: any; labels: any; poi: any; }) => [
  // The main background/geometry of the map
  { elementType: 'geometry', stylers: [{ color: colors.background }] },
  // The color of the text for most labels
  { elementType: 'labels.text.fill', stylers: [{ color: colors.labels }] },
  // The outline of the text for most labels
  { elementType: 'labels.text.stroke', stylers: [{ color: colors.background }] },
  // Specific label colors for places of interest (POIs)
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: colors.poi }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: colors.poi }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  // Road colors
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: colors.road }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: colors.background }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: colors.labels }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: colors.poi }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: colors.background }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  // Transit colors
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: colors.poi }] },
  // Water colors
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: colors.water }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: colors.labels }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: colors.water }] },
];