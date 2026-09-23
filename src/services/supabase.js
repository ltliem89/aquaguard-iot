/**
 * Supabase REST API Service
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 * 
 * Interacts directly with Supabase PostgREST endpoints using publishable/anon key only.
 * No service_role key is ever accepted or stored.
 */

const STORAGE_URL_KEY = 'iot_supabase_url';
const STORAGE_ANON_KEY = 'iot_supabase_key';

const DEFAULT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://srnghkvozbjuufpumaqf.supabase.co';
const DEFAULT_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kQOCHG9Ug6NUpjCwfk-l0g_wotfR_tg';

export function getSupabaseConfig() {
  const storedUrl = localStorage.getItem(STORAGE_URL_KEY);
  const storedKey = localStorage.getItem(STORAGE_ANON_KEY);
  return {
    url: (storedUrl !== null && storedUrl !== undefined ? storedUrl : DEFAULT_URL).trim().replace(/\/+$/, ''),
    key: (storedKey !== null && storedKey !== undefined ? storedKey : DEFAULT_KEY).trim()
  };
}

export function saveSupabaseConfig(url, key) {
  const cleanUrl = (url || '').trim().replace(/\/+$/, '');
  const cleanKey = (key || '').trim();
  localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
  localStorage.setItem(STORAGE_ANON_KEY, cleanKey);
  return { url: cleanUrl, key: cleanKey };
}

export async function apiFetch(path, options = {}) {
  const { url, key } = getSupabaseConfig();
  if (!key) {
    throw new Error('Please enter the publishable/anon key.');
  }

  const headers = {
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url + '/rest/v1/' + path, { ...options, headers });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} — ${errText}`);
  }
  return res;
}

export async function fetchRows() {
  const res = await apiFetch('sensor_readings?select=*&order=created_at.desc&limit=100');
  return await res.json();
}

export async function fetchStations() {
  const res = await apiFetch('stations?select=id,station_code,status,last_seen&order=id.asc');
  return await res.json();
}

export async function fetchThresholds() {
  const res = await apiFetch('alert_thresholds?select=*&order=station_id.asc');
  return await res.json();
}

export async function saveThresholdApi(stationId, vals) {
  return await apiFetch(`alert_thresholds?station_id=eq.${stationId}`, {
    method: 'PATCH',
    body: JSON.stringify(vals),
    headers: { 'Prefer': 'return=minimal' }
  });
}

export async function fetchLatestCommands() {
  // Read only EMERGENCY commands. The newest EMERGENCY command for each station
  // is the source of truth for the persistent Emergency visual state.
  const res = await apiFetch('device_commands?select=id,station_id,command,value,status,created_at,executed_at&command=eq.EMERGENCY&order=created_at.desc&limit=100');
  return await res.json();
}

export async function insertDeviceCommand(stationId, command, value) {
  return await apiFetch('device_commands', {
    method: 'POST',
    body: JSON.stringify({ station_id: stationId, command, value }),
    headers: { 'Prefer': 'return=minimal' }
  });
}
