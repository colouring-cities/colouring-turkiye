import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { AttributionControl, MapContainer, ZoomControl, useMapEvent, Pane, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import './map.css';

import { apiGet } from '../apiHelpers';
import { HelpIcon } from '../components/icons';
import { Category } from '../config/categories-config';
import { initialMapViewport, mapBackgroundColor, MapTheme, LayerEnablementState } from '../config/map-config';

import { Building } from '../models/building';

import { CityBaseMapLayer } from './layers/city-base-map-layer';
import { CityBoundaryLayer } from './layers/city-boundary-layer';
import { BoroughBoundaryLayer } from './layers/borough-boundary-layer';
import { ParcelBoundaryLayer } from './layers/parcel-boundary-layer';
import { HistoricDataLayer } from './layers/historic-data-layer';
import { FloodBoundaryLayer } from './layers/flood-boundary-layer';
import { ConservationAreaBoundaryLayer } from './layers/conservation-boundary-layer';
import { VistaBoundaryLayer } from './layers/vista-boundary-layer';
import { HousingBoundaryLayer } from './layers/housing-boundary-layer';
import { CreativeBoundaryLayer } from './layers/creative-boundary-layer';
import { BuildingBaseLayer } from './layers/building-base-layer';
import { BuildingDataLayer } from './layers/building-data-layer';
import { BuildingNumbersLayer } from './layers/building-numbers-layer';
import { BuildingHighlightLayer } from './layers/building-highlight-layer';

import { Legend } from './legend';
import SearchBox from './search-box';
import ThemeSwitcher from './theme-switcher';
import DataLayerSwitcher from './data-switcher';
import { BoroughSwitcher } from './borough-switcher';
import { ParcelSwitcher } from './parcel-switcher';
import { FloodSwitcher } from './flood-switcher';
import { ConservationAreaSwitcher } from './conservation-switcher';
import { HistoricDataSwitcher } from './historic-data-switcher';
import { VistaSwitcher } from './vista-switcher';
import { CreativeSwitcher } from './creative-switcher';
import { HousingSwitcher } from './housing-switcher';
import { BuildingMapTileset } from '../config/tileserver-config';
import { useDisplayPreferences } from '../displayPreferences-context';
import { CategoryMapDefinition } from '../config/category-maps-config';

interface ColouringMapProps {
    selectedBuildingId: number;
    mode: 'basic' | 'view' | 'edit' | 'multi-edit';
    revisionId: string;
    onBuildingAction: (building: Building) => void;
    mapColourScale: BuildingMapTileset;
    onMapColourScale: (x: BuildingMapTileset) => void;
    categoryMapDefinitions: CategoryMapDefinition[]
}

export const ColouringMap : FC<ColouringMapProps> = ({
    mode,
    revisionId,
    onBuildingAction,
    selectedBuildingId,
    mapColourScale,
    onMapColourScale,
    categoryMapDefinitions,
    children
}) => {
    const { darkLightTheme, darkLightThemeSwitch } = useDisplayPreferences();
    const [dataLayers, setDataLayers] = useState<LayerEnablementState>('disabled');
    const [position, setPosition] = useState(initialMapViewport.position);
    const [zoom, setZoom] = useState(initialMapViewport.zoom);


    const handleLocate = useCallback(
        (lat: number, lng: number, zoom: number) => {
            setPosition([lat, lng]);
            setZoom(zoom);
        },
        []
    );

    const handleClick = useCallback(
        async (e) => {
            const {lat, lng} = e.latlng;
            const data = await apiGet(`/api/buildings/locate?lat=${lat}&lng=${lng}`);
            const building = data?.[0];
            onBuildingAction(building);
        },
        [onBuildingAction],
    )

    const layerSwitch = useCallback(
        (e) => {
            e.preventDefault();
            const newDisplayState = (dataLayers === 'enabled')? 'disabled' : 'enabled';
            setDataLayers(newDisplayState);
        },
        [dataLayers],
    )

    const hasSelection = selectedBuildingId != undefined;
    const isEdit = ['edit', 'multi-edit'].includes(mode);

    return (
        <div className="map-container">
            <MapContainer
                center={initialMapViewport.position}
                zoom={initialMapViewport.zoom}
                minZoom={9}
                maxZoom={18}
                doubleClickZoom={false}
                zoomControl={false}
                attributionControl={false}
            >
                <ClickHandler onClick={handleClick} />
                <MapBackgroundColor theme={darkLightTheme} />
                <MapViewport position={position} zoom={zoom} />

                <Pane
                    key={darkLightTheme}
                    name={'cc-base-pane'}
                    style={{zIndex: 50}}
                >
                    <CityBaseMapLayer theme={darkLightTheme} />
                    <BuildingBaseLayer theme={darkLightTheme} />
                </Pane>

                <Pane
                    name='cc-overlay-pane-shown-behind-buildings'
                    style={{zIndex: 199}}
                >
                    <ConservationAreaBoundaryLayer/>
                </Pane>

                {
                    mapColourScale &&
                        <BuildingDataLayer
                            tileset={mapColourScale}
                            revisionId={revisionId}
                        />
                }

                <Pane
                    name='cc-overlay-pane'
                    style={{zIndex: 300}}
                >
                    <CityBoundaryLayer/>
                    <HistoricDataLayer/>
                    <BoroughBoundaryLayer/>
                    <ParcelBoundaryLayer/>
                    <FloodBoundaryLayer/>
                    <VistaBoundaryLayer/>
                    <HousingBoundaryLayer/>
                    <CreativeBoundaryLayer/>
                    <BuildingNumbersLayer revisionId={revisionId} />
                    {
                        selectedBuildingId &&
                            <BuildingHighlightLayer
                                selectedBuildingId={selectedBuildingId}
                                baseTileset={mapColourScale} 
                            />
                    }
                </Pane>

                <ZoomControl position="topright" />
                <AttributionControl prefix=""/>
            </MapContainer>
            {
                mode !== 'basic' &&
                <>
                    <Legend mapColourScaleDefinitions={categoryMapDefinitions} mapColourScale={mapColourScale} onMapColourScale={onMapColourScale}/>
                    <ThemeSwitcher onSubmit={darkLightThemeSwitch} currentTheme={darkLightTheme} />
                    <DataLayerSwitcher onSubmit={layerSwitch} currentDisplay={dataLayers} />
                    {
                        (dataLayers == "enabled") ?
                        <>
                            <BoroughSwitcher/>
                            <ParcelSwitcher/>
                            <FloodSwitcher/>
                            <ConservationAreaSwitcher/>
                            <HistoricDataSwitcher/>
                            <VistaSwitcher />
                            <HousingSwitcher />
                            <CreativeSwitcher />
                        </>
                        : <></>
                    }
                    {/* TODO change remaining ones*/}
                    <SearchBox onLocate={handleLocate} />
                </>
            }
        </div>
    );
}

function ClickHandler({ onClick }: {onClick: (e) => void}) {
    useMapEvent('click', (e) => onClick(e));
    
    return null;
}

function MapBackgroundColor({ theme}: {theme: MapTheme}) {
    const map = useMap();
    useEffect(() => {
        map.getContainer().style.backgroundColor = mapBackgroundColor[theme];
    });

    return null;
}

function MapViewport({
    position,
    zoom
}: {
    position: [number, number];
    zoom: number;
}) {
    const map = useMap();

    useEffect(() => {
        map.setView(position, zoom)
    }, [position, zoom]);

    return null;
}
