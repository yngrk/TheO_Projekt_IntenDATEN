export interface DataItem {
    [key: string]: any
}

export interface SuccessResponse {
    success: true;
    data: any[];
}

export interface ErrorResponse {
    success: false;
    message: string;
    error: string;
}

export interface Transform {
    scale: [number, number];
    translate: [number, number];
}

export interface PlaceProperties {
    name: string;
    nameEN: string | null;
    state: string;
}

export interface PlaceGeometry {
    type: 'Point';
    coordinates: [number, number];
    properties: PlaceProperties;
    id: string;
}

export interface GeometryCollection {
    type: 'GeometryCollection';
    geometries: any[]; // Replace 'any' with specific geometry types as needed
}

export interface TopoJsonObjects {
    berlin: GeometryCollection;
    counties: GeometryCollection;
    places: GeometryCollection;
    states: GeometryCollection;
    // Add other collections if present
}

export interface TopoJsonData {
    type: 'Topology';
    arcs: any[]; // Replace 'any' with the specific type if needed
    transform: Transform;
    objects: TopoJsonObjects;
    // Include other TopoJSON properties if necessary
}