'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Camera, DetectionEvent, Spot, Zone } from '@/types';
import {
  deleteCamera,
  deleteRegion,
  fetchCameraEvents,
  fetchCameras,
  fetchZone,
  fetchZones,
  recalibrateCamera,
  startCamera,
  stopCamera,
  updateRegion,
} from '@/lib/api';
import { T } from '@/components/enforce/tokens';
import CameraList from './CameraList';
import AddCameraModal from './AddCameraModal';
import CameraLiveView from './CameraLiveView';
import RegionEditor from './RegionEditor';
import RegionList from './RegionList';
import EventsFeed from './EventsFeed';

interface SpotGroup {
  zoneName: string;
  spots: Spot[];
}

export default function CamerasAdmin() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [spotGroups, setSpotGroups] = useState<SpotGroup[]>([]);
  const [events, setEvents] = useState<DetectionEvent[]>([]);

  const selected = cameras.find((c) => c.id === selectedId) ?? null;

  const loadCameras = useCallback(async (silent = false) => {
    try {
      const list = await fetchCameras();
      setCameras(list);
      setLoadError(null);
      setSelectedId((cur) => (cur === null && list.length > 0 ? list[0].id : cur));
    } catch (e) {
      if (!silent) setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const loadEvents = useCallback(async (cameraId: number) => {
    try {
      setEvents(await fetchCameraEvents(cameraId, 30));
    } catch {
      /* keep last good feed */
    }
  }, []);

  const loadSpotCatalogue = useCallback(async () => {
    try {
      const zones = (await fetchZones()) as Zone[];
      const groups: SpotGroup[] = [];
      for (const z of zones) {
        const detail = await fetchZone(z.id);
        groups.push({ zoneName: z.name, spots: detail.spots ?? [] });
      }
      setSpotGroups(groups);
    } catch {
      /* spot dropdowns stay empty */
    }
  }, []);

  // initial load + spot catalogue (deferred so state updates are not synchronous
  // in the effect body)
  useEffect(() => {
    const t = setTimeout(() => {
      loadCameras();
      loadSpotCatalogue();
    }, 0);
    return () => clearTimeout(t);
  }, [loadCameras, loadSpotCatalogue]);

  // poll camera states (region statuses / frames) and the event feed
  useEffect(() => {
    const t = setInterval(() => loadCameras(true), 3000);
    return () => clearInterval(t);
  }, [loadCameras]);

  useEffect(() => {
    if (selectedId === null) return;
    const initial = setTimeout(() => loadEvents(selectedId), 0);
    const t = setInterval(() => loadEvents(selectedId), 5000);
    return () => {
      clearTimeout(initial);
      clearInterval(t);
    };
  }, [selectedId, loadEvents]);

  async function run(action: (id: number) => Promise<unknown>, id: number) {
    setBusy(true);
    try {
      await action(id);
      await loadCameras(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCamera(id: number) {
    if (!window.confirm('Delete this camera and all of its regions?')) return;
    await run(deleteCamera, id);
    setSelectedId((cur) => (cur === id ? null : cur));
  }

  async function handleRebind(regionId: number, spotId: string | null) {
    try {
      await updateRegion(regionId, { spot_id: spotId });
      await loadCameras(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDeleteRegion(regionId: number) {
    if (!window.confirm('Delete this region?')) return;
    try {
      await deleteRegion(regionId);
      await loadCameras(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: T.bg0 }}>
      {/* header */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.85)', borderColor: T.border }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/demo"
            className="p-2 rounded-lg transition-colors"
            style={{ color: T.text2 }}
            title="Back to map"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-base font-semibold leading-tight" style={{ color: T.text1 }}>
              Camera Vision
            </h1>
            <p className="text-[11px]" style={{ color: T.text2 }}>
              OpenCV occupancy detection — bays drawn on live feeds drive spot status
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 flex flex-col lg:flex-row gap-4 items-start">
        <CameraList
          cameras={cameras}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={() => setShowAdd(true)}
        />

        <div className="flex-1 w-full flex flex-col gap-4">
          {loadError && (
            <p
              className="text-xs rounded-lg px-3 py-2 border"
              style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: T.red }}
            >
              {loadError}
            </p>
          )}

          {!selected ? (
            <div
              className="rounded-2xl border p-10 text-center text-sm"
              style={{ backgroundColor: T.bg2, borderColor: T.border, color: T.text3 }}
            >
              Select a camera on the left, or add one to get started.
            </div>
          ) : (
            <>
              <CameraLiveView
                camera={selected}
                busy={busy}
                onStart={() => run(startCamera, selected.id)}
                onStop={() => run(stopCamera, selected.id)}
                onRecalibrate={() => run(recalibrateCamera, selected.id)}
                onDelete={() => handleDeleteCamera(selected.id)}
              />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                <RegionEditor
                  cameraId={selected.id}
                  frameWidth={selected.width}
                  frameHeight={selected.height}
                  regionCount={selected.regions.length}
                  spotGroups={spotGroups}
                  onSaved={() => loadCameras(true)}
                />
                <RegionList
                  regions={selected.regions}
                  spotGroups={spotGroups}
                  onRebind={handleRebind}
                  onDelete={handleDeleteRegion}
                />
              </div>

              <EventsFeed events={events} />
            </>
          )}
        </div>
      </main>

      {showAdd && (
        <AddCameraModal
          onClose={() => setShowAdd(false)}
          onCreated={(id) => {
            setShowAdd(false);
            setSelectedId(id);
            loadCameras(true);
          }}
        />
      )}
    </div>
  );
}
