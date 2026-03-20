declare module 'leaflet.heat' {
  import * as L from 'leaflet';
  export interface HeatLayerOptions {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    gradient?: Record<number, string>;
    minOpacity?: number;
  }
  export function heatLayer(latlngs: Array<[number, number, number?]>, options?: HeatLayerOptions): L.Layer;
}

declare namespace L {
  function heatLayer(latlngs: Array<[number, number, number?]>, options?: any): L.Layer;
}
