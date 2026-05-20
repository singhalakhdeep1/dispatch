"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Fix default leaflet icons (broken with webpack)
const fixIcon = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
};

const driverIcon = new L.DivIcon({
    html: `<div style="background:#f97316;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)">🛵</div>`,
    iconSize: [32, 32],
    className: "",
});

interface Props {
    driverLoc: { lat: number; lng: number } | null;
}

export function LiveMap({ driverLoc }: Props) {
    useEffect(() => { fixIcon(); }, []);

    const center: [number, number] = driverLoc
        ? [driverLoc.lat, driverLoc.lng]
        : [19.076, 72.8777];

    return (
        <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {driverLoc && (
                <Marker position={[driverLoc.lat, driverLoc.lng]} icon={driverIcon}>
                    <Popup>Driver is here</Popup>
                </Marker>
            )}
        </MapContainer>
    );
}
