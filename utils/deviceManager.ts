import { UAParser } from 'ua-parser-js';
import { supabase } from '../services/supabaseClient';

export interface DeviceSession {
    deviceId: string;
    browser: string;
    os: string;
    lastActive: string;
    isCurrentDevice?: boolean;
}

export const getDeviceId = () => {
    let id = localStorage.getItem('pakar_device_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('pakar_device_id', id);
    }
    return id;
};

export const getDeviceInfo = (): Omit<DeviceSession, 'lastActive'> => {
    const parser = new UAParser();
    const result = parser.getResult();
    return {
        deviceId: getDeviceId(),
        browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
        os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
    };
};

export const syncDeviceSession = async (authUser: any) => {
    try {
        const currentDevice = getDeviceInfo();
        const devices: DeviceSession[] = authUser.user_metadata?.devices || [];
        
        // Check if current device is in the list
        const deviceIndex = devices.findIndex(d => d.deviceId === currentDevice.deviceId);
        
        // If it's a new device or we need to update lastActive
        const now = new Date().toISOString();
        let updatedDevices = [...devices];
        
        if (deviceIndex >= 0) {
            // Update existing
            updatedDevices[deviceIndex] = {
                ...updatedDevices[deviceIndex],
                ...currentDevice,
                lastActive: now
            };
        } else {
            // Add new
            updatedDevices.push({
                ...currentDevice,
                lastActive: now
            });
        }
        
        // Limit to 10 devices, remove oldest
        if (updatedDevices.length > 10) {
            updatedDevices.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
            updatedDevices = updatedDevices.slice(0, 10);
        }
        
        // Only update if it's a new device or lastActive is older than 1 hour to prevent too many API calls
        const shouldUpdate = deviceIndex < 0 || 
            (new Date(now).getTime() - new Date(devices[deviceIndex].lastActive).getTime() > 3600000);
            
        if (shouldUpdate) {
            await supabase.auth.updateUser({
                data: { devices: updatedDevices }
            });
        }
        
        return true;
    } catch (e) {
        console.warn("Failed to sync device session", e);
        return false;
    }
};

export const checkDeviceAllowed = (authUser: any): boolean => {
    const devices: DeviceSession[] = authUser.user_metadata?.devices || [];
    const currentDeviceId = getDeviceId();
    
    // If devices list is empty, it means no devices registered yet, so we allow it (it will be registered in syncDeviceSession)
    if (devices.length === 0) return true;
    
    // Check if current device is in the list
    return devices.some(d => d.deviceId === currentDeviceId);
};
