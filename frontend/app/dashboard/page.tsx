'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeartPulse, Bell, Phone, MessageCircle, Plus, CheckCircle, XCircle, Clock, Pill, Users, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import ids from '../../lib/ids.json';

interface Reminder {
    id: string;
    scheduledTime: string;
    daysOfWeek: number[];
    medicine: {
        id: string;
        name: string;
        dosage: string;
    };
}

interface Medicine {
    id: string;
    name: string;
    dosage: string;
    stockQuantity: number;
    lowStockThreshold: number;
}

interface Caregiver {
    id: string;
    name: string;
    phoneNumber: string;
    relationship: string;
}

export default function Dashboard() {
    const [stats, setStats] = useState({ active: 0, completed: 0, missed: 0 });
    const [logs, setLogs] = useState<any[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [caregivers, setCaregivers] = useState<Caregiver[]>([]);

    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCaregiverModal, setShowCaregiverModal] = useState(false);

    // Caregiver Form
    const [newCaregiver, setNewCaregiver] = useState({
        name: '',
        phoneNumber: '',
        relationship: 'Son'
    });

    // Form State
    const [newReminder, setNewReminder] = useState({
        medicineId: '',
        time: '09:00',
        days: [0, 1, 2, 3, 4, 5, 6] // Default daily
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Parallel fetching
            const [logsRes, remindersRes, medicinesRes, caregiversRes] = await Promise.all([
                api.get(`/reminders/logs/${ids.userId}`),
                api.get(`/reminders/user/${ids.userId}`),
                api.get(`/medicines?userId=${ids.userId}`),
                api.get(`/caregivers/user/${ids.userId}`)
            ]);

            setLogs(logsRes.data);
            setReminders(remindersRes.data);
            setMedicines(medicinesRes.data);
            setCaregivers(caregiversRes.data);

            // Setup stats
            setStats({
                active: remindersRes.data.length,
                completed: logsRes.data.filter((l: any) => l.status === 'confirmed').length,
                missed: 0 // logic to be added
            });

        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    const handleAddReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/reminders/create', {
                userId: ids.userId,
                medicineId: newReminder.medicineId || medicines[0]?.id, // Default to first if not selected
                scheduledTime: newReminder.time,
                daysOfWeek: newReminder.days
            });
            setShowAddModal(false);
            fetchData(); // Refresh all
            alert('Reminder created successfully!');
        } catch (err: any) {
            alert('Failed to create reminder: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAddCaregiver = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/caregivers', {
                userId: ids.userId,
                ...newCaregiver
            });
            setShowCaregiverModal(false);
            setNewCaregiver({ name: '', phoneNumber: '', relationship: 'Son' });
            fetchData();
            alert('Caregiver added!');
        } catch (err: any) {
            alert('Failed to add caregiver: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCaregiver = async (id: string) => {
        if (!confirm('Remove this caregiver?')) return;
        try {
            await api.delete(`/caregivers/${id}`);
            fetchData();
        } catch (err) { alert('Failed to delete'); }
    };

    const handleUpdateStock = async (id: string, newStock: number) => {
        try {
            await api.patch(`/medicines/${id}/stock`, { quantity: newStock });
            // Optimistic update
            setMedicines(medicines.map(m => m.id === id ? { ...m, stockQuantity: newStock } : m));
        } catch (err) {
            alert('Failed to update stock');
            fetchData(); // Revert on fail
        }
    };

    const triggerTest = async (type: 'voice' | 'whatsapp') => {
        setLoading(true);
        try {
            await api.post('/reminders/test-flow', {
                userId: ids.userId,
                medicineId: ids.medicineId,
                type // Send 'voice' or 'whatsapp'
            });
            alert(`Test ${type} triggered! Check Live Log.`);

            let checks = 0;
            const interval = setInterval(() => {
                fetchData(); // We refresh everything to see logs
                checks++;
                if (checks > 5) clearInterval(interval);
            }, 2000);

        } catch (err) {
            console.error(err);
            alert('Failed to trigger test.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans p-6 md:p-12 relative">

            {/* Header */}
            <header className="max-w-6xl mx-auto mb-12 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="hover:opacity-70 transition-opacity">
                        <HeartPulse className="h-8 w-8 text-red-600" />
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                </div>
                <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">TB</div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-3">

                {/* Stats */}
                <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <StatCard icon={<Bell className="text-blue-500" />} label="Active Reminders" value={stats.active.toString()} />
                    <StatCard icon={<CheckCircle className="text-green-500" />} label="Taken Today" value={stats.completed.toString()} />
                    <StatCard icon={<XCircle className="text-red-500" />} label="Missed" value={stats.missed.toString()} />
                </div>

                {/* Simulation */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm col-span-full md:col-span-2">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <ActivityIcon className="text-purple-500" /> Simulation Center
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                        <button onClick={() => triggerTest('whatsapp')} disabled={loading} className="sim-btn group">
                            <MessageCircle className="h-8 w-8 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Test WhatsApp</span>
                            <span className="text-xs text-zinc-500 mt-1">Immediate Alert</span>
                        </button>

                        <button onClick={() => triggerTest('voice')} disabled={loading} className="sim-btn group">
                            <Phone className="h-8 w-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Test Voice Call</span>
                            <span className="text-xs text-zinc-500 mt-1">Emergency Simulation</span>
                        </button>
                    </div>

                    <div className="mb-6 flex justify-center">
                        <button
                            onClick={async () => {
                                if (reminders.length === 0) return alert('No active reminders to confirm');
                                try {
                                    await api.post(`/reminders/${reminders[0].id}/confirm`, { userId: ids.userId, source: 'whatsapp' });
                                    alert('Reply "YES" simulated! Stock should decrease.');
                                    fetchData();
                                } catch (e) { alert('Failed to simulate reply'); }
                            }}
                            className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                        >
                            Simulate Reply "YES" (For Latest Reminder)
                        </button>
                    </div>

                    {/* Logs */}
                    <div className="bg-zinc-50 dark:bg-zinc-950 rounded-lg p-4 h-64 overflow-y-auto border border-zinc-200 dark:border-zinc-800 space-y-3 font-mono text-sm">
                        {logs.length === 0 ? (
                            <p className="text-zinc-400 text-center py-10">No activity yet.</p>
                        ) : (
                            logs.map((log: any) => (
                                <div key={log.id} className="flex gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                    <span className="text-zinc-400 text-xs min-w-[70px]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                    <div className="flex-1">
                                        <span className={`font-bold mr-2 ${log.status === 'sent' ? 'text-blue-500' : 'text-green-500'}`}>{log.status.toUpperCase()}</span>
                                        <span className="text-xs text-zinc-500">{log.medicine?.name}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Upcoming Reminders (Real Data) */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Clock className="text-orange-500" /> Upcoming
                    </h2>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                        {reminders.length === 0 ? (
                            <p className="text-zinc-500 text-sm text-center py-4">No active reminders.</p>
                        ) : (
                            reminders.map(rem => (
                                <div key={rem.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{rem.medicine?.name}</p>
                                        <p className="text-xs text-zinc-500">{rem.medicine?.dosage} • {rem.scheduledTime}</p>
                                    </div>
                                </div>
                            ))
                        )}

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            <Plus className="h-4 w-4" /> Add Reminder
                        </button>
                    </div>
                </div>

                {/* Medicine Cabinet */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Pill className="text-cyan-500" /> Medicine Cabinet
                    </h2>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                        {medicines.length === 0 ? (
                            <p className="text-zinc-500 text-sm text-center py-4">No medicines found.</p>
                        ) : (
                            medicines.map(med => (
                                <div key={med.id} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-medium text-sm">{med.name}</p>
                                            <p className="text-xs text-zinc-500">{med.dosage}</p>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-xs font-bold ${med.stockQuantity <= med.lowStockThreshold ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {med.stockQuantity} Left
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleUpdateStock(med.id, Math.max(0, med.stockQuantity - 1))}
                                            className="flex-1 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:opacity-80 transition-opacity"
                                        >
                                            Take 1
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStock(med.id, med.stockQuantity + 30)}
                                            className="flex-1 py-1 text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 rounded hover:opacity-80 transition-opacity font-medium"
                                        >
                                            Refill (+30)
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Caregiver Circle */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Users className="text-pink-500" /> Caregiver Circle
                    </h2>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                        <div className="text-sm text-zinc-500 mb-2">
                            These people will be alerted if you miss a dose.
                        </div>
                        {caregivers.length === 0 ? (
                            <div className="p-4 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-center">
                                <p className="text-zinc-500 text-sm mb-2">No caregivers yet</p>
                            </div>
                        ) : (
                            caregivers.map(cg => (
                                <div key={cg.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-xs">
                                            {cg.relationship[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{cg.name}</p>
                                            <p className="text-xs text-zinc-500">{cg.phoneNumber}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteCaregiver(cg.id)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        )}

                        <button
                            onClick={() => setShowCaregiverModal(true)}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors"
                        >
                            <Plus className="h-4 w-4" /> Add Caregiver
                        </button>
                    </div>
                </div>

            </main>

            {/* Add Reminder Modal */}
            {showAddModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4">Add New Reminder</h3>
                        <form onSubmit={handleAddReminder} className="space-y-4">

                            <div>
                                <label className="block text-sm font-medium mb-1">Medicine</label>
                                <select
                                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent"
                                    value={newReminder.medicineId}
                                    onChange={e => setNewReminder({ ...newReminder, medicineId: e.target.value })}
                                >
                                    {medicines.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.dosage})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Time</label>
                                <input
                                    type="time"
                                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent"
                                    value={newReminder.time}
                                    onChange={e => setNewReminder({ ...newReminder, time: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-2 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Reminder'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Caregiver Modal */}
            {showCaregiverModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4">Add Caregiver</h3>
                        <form onSubmit={handleAddCaregiver} className="space-y-4">

                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent"
                                    value={newCaregiver.name}
                                    onChange={e => setNewCaregiver({ ...newCaregiver, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Relationship</label>
                                <select
                                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent"
                                    value={newCaregiver.relationship}
                                    onChange={e => setNewCaregiver({ ...newCaregiver, relationship: e.target.value })}
                                >
                                    <option value="Son">Son</option>
                                    <option value="Daughter">Daughter</option>
                                    <option value="Spouse">Spouse</option>
                                    <option value="Doctor">Doctor</option>
                                    <option value="Friend">Friend</option>
                                    <option value="Caregiver">Caregiver</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Phone Number (WhatsApp)</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent"
                                    value={newCaregiver.phoneNumber}
                                    onChange={e => setNewCaregiver({ ...newCaregiver, phoneNumber: e.target.value })}
                                    placeholder="e.g. +919999999999"
                                />
                                <p className="text-xs text-zinc-500 mt-1">Must include country code</p>
                            </div>

                            <div className="flex gap-2 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCaregiverModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                                >
                                    {loading ? 'Adding...' : 'Add to Circle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

// Subcomponents
function StatCard({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h3 className="text-2xl font-bold">{value}</h3>
                <p className="text-sm text-zinc-500">{label}</p>
            </div>
        </div>
    );
}

function ActivityIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
