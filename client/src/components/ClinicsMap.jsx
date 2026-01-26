import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const isValidCoord = (lat, lng) => {
  const la = parseFloat(lat);
  const lo = parseFloat(lng);
  return !isNaN(la) && !isNaN(lo);
};

const ClinicsMap = ({ clinics }) => {
  const defaultCenter = [-2.9001, -79.0059];

  const validClinics = clinics.filter(c =>
    isValidCoord(c.latitude, c.longitude)
  );

  return (
    <div className="h-96 mb-8 rounded-xl overflow-hidden shadow border">
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {validClinics.map(clinic => (
          <Marker
            key={clinic.id}
            position={[
              parseFloat(clinic.latitude),
              parseFloat(clinic.longitude),
            ]}
          >
            <Popup>
              <strong>{clinic.name}</strong><br/>
              {clinic.address}<br/>
              <a
                href={`https://www.google.com/maps?q=${clinic.latitude},${clinic.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Abrir en Google Maps
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ClinicsMap;
