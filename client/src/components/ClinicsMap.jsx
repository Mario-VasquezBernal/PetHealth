import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix icon bug
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ClinicsMap = ({ clinics }) => {
  if (!clinics || clinics.length === 0) return null;

  const center = [
    parseFloat(clinics[0].latitude),
    parseFloat(clinics[0].longitude),
  ];

  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-6">
      <h3 className="font-bold text-lg mb-3">📍 Clínicas registradas</h3>

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "350px", width: "100%", borderRadius: "12px" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {clinics.map((clinic) => (
          <Marker
            key={clinic.id}
            position={[
              parseFloat(clinic.latitude),
              parseFloat(clinic.longitude),
            ]}
          >
            <Popup>
              <strong>{clinic.name}</strong>
              <br />
              {clinic.address}
              <br />
              {clinic.city}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ClinicsMap;
