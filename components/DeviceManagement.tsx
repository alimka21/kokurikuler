import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { DeviceSession, getDeviceId } from '../utils/deviceManager';
import { Laptop, Smartphone, Monitor, Trash2, LogOut, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';

const DeviceManagement: React.FC = () => {
    const [devices, setDevices] = useState<DeviceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const currentDeviceId = getDeviceId();

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.user_metadata?.devices) {
                setDevices(user.user_metadata.devices);
            }
        } catch (e) {
            console.warn("Failed to fetch devices", e);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveDevice = async (deviceIdToRemove: string) => {
        const isCurrent = deviceIdToRemove === currentDeviceId;
        
        const result = await Swal.fire({
            title: isCurrent ? 'Keluar dari perangkat ini?' : 'Hapus Perangkat?',
            text: isCurrent 
                ? 'Anda akan keluar dari sesi saat ini.' 
                : 'Perangkat ini akan dikeluarkan dari akun Anda.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Lanjutkan'
        });

        if (result.isConfirmed) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const updatedDevices = devices.filter(d => d.deviceId !== deviceIdToRemove);
                
                await supabase.auth.updateUser({
                    data: { devices: updatedDevices }
                });

                if (isCurrent) {
                    await supabase.auth.signOut();
                    window.location.reload();
                } else {
                    setDevices(updatedDevices);
                    Swal.fire('Berhasil', 'Perangkat telah dihapus.', 'success');
                }
            } catch (e: any) {
                Swal.fire('Gagal', 'Gagal menghapus perangkat.', 'error');
            }
        }
    };

    const getDeviceIcon = (os: string) => {
        const lowerOs = os.toLowerCase();
        if (lowerOs.includes('android') || lowerOs.includes('ios')) return <Smartphone className="w-6 h-6 text-slate-500" />;
        if (lowerOs.includes('mac') || lowerOs.includes('windows') || lowerOs.includes('linux')) return <Laptop className="w-6 h-6 text-slate-500" />;
        return <Monitor className="w-6 h-6 text-slate-500" />;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return <div className="p-4 text-center text-slate-500">Memuat data perangkat...</div>;
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <ShieldCheck size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Perangkat Aktif</h3>
                    <p className="text-sm text-slate-500">Kelola sesi login Anda di berbagai perangkat.</p>
                </div>
            </div>
            
            <div className="divide-y divide-slate-100">
                {devices.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                        Belum ada data perangkat.
                    </div>
                ) : (
                    devices.map((device) => {
                        const isCurrent = device.deviceId === currentDeviceId;
                        return (
                            <div key={device.deviceId} className={`p-6 flex items-center justify-between gap-4 transition-colors ${isCurrent ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                        {getDeviceIcon(device.os)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-800">{device.os}</h4>
                                            {isCurrent && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                    Perangkat Ini
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            {device.browser}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Aktif: {formatDate(device.lastActive)}
                                        </p>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => handleRemoveDevice(device.deviceId)}
                                    className={`p-2 rounded-lg transition-colors ${isCurrent ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-200' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                                    title={isCurrent ? "Keluar" : "Hapus Perangkat"}
                                >
                                    {isCurrent ? <LogOut size={20} /> : <Trash2 size={20} />}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DeviceManagement;
