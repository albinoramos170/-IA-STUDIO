
import React, { useEffect, useRef, useContext } from "react";
import L from "leaflet";
import { ProjectContext } from '../contexts/ProjectContext';

export default function Heatmap() {
  const mapRef = useRef<L.Map | null>(null);
  const context = useContext(ProjectContext);
  
  // Default center (Angola roughly)
  const centerLat = -12.5;
  const centerLng = 17.0;

  useEffect(() => {
    if (!context) return;
    const { samples } = context;

    // 1. Initialize Map
    if (!mapRef.current) {
        const Leaflet = L;
        if (!Leaflet) return;
        
        const map = Leaflet.map("heatmap-container").setView([centerLat, centerLng], 13);
        mapRef.current = map;

        Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap"
        }).addTo(map);
    }

    const map = mapRef.current;
    const Leaflet = L;

    // 2. Generate Points from Samples
    // We map 'Line' and 'Pit' to relative coordinates.
    // Line number -> Latitude offset
    // Pit number -> Longitude offset
    
    const heatPoints = samples.map(s => {
        const lineNum = parseInt(s.line.replace(/\D/g, '')) || 0;
        const pitNum = parseInt(s.pit.replace(/\D/g, '')) || 0;
        
        // Projection: ~100-200m spacing
        const lat = centerLat + (lineNum * 0.002);
        const lng = centerLng + (pitNum * 0.002);
        
        // Grade (carats / m3)
        const vol = s.area * s.gravelDepth;
        const grade = vol > 0 ? s.carats / vol : 0;
        
        return [lat, lng, grade]; 
    });

    // 3. Add Heat Layer
    if ((Leaflet as any).heatLayer && heatPoints.length > 0) {
        // Ideally remove old layer, but for now we just add.
        // Since we use a persistent map ref, repeated additions stack.
        // Let's try to clear simple loop.
        map.eachLayer((layer) => {
            if ((layer as any)._heat) {
                map.removeLayer(layer);
            }
        });

        const maxGrade = Math.max(...heatPoints.map(p => p[2])) || 1;

        (Leaflet as any).heatLayer(heatPoints, {
            radius: 40,
            blur: 25,
            maxZoom: 15,
            max: maxGrade
        }).addTo(map);
        
        // Fit bounds
        if (heatPoints.length > 0) {
            const bounds = Leaflet.latLngBounds(heatPoints.map(p => [p[0], p[1]] as [number, number]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

  }, [context]); 

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
         <h1 className="text-xl font-bold text-secondary-900 dark:text-secondary-100">Mapa de Calor - Teores Diamantíferos</h1>
         <span className="text-xs text-secondary-500 bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded">
           Generated from Sample Data
         </span>
      </div>
      <div
        id="heatmap-container"
        style={{
          width: "100%",
          height: "600px",
          borderRadius: "10px",
          overflow: "hidden",
          border: "2px solid #ccc"
        }}
        className="border-secondary-300 dark:border-secondary-700 z-0"
      ></div>
    </div>
  );
}
