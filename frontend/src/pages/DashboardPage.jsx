import { useEffect, useState } from 'react';
import { fetchDashboardData, exportExcel } from '../services/api';
import { Download, AlertCircle, Ticket, LogOut, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const result = await fetchDashboardData();
            setData(result);
        } catch (err) {
            console.error("Failed to fetch data", err);
            // If unauthorized, redirect to login
            if (err.response && err.response.status === 401) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await exportExcel();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `OpsNexus_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Export failed", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    }

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary-500/20 p-2 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-primary-400" />
                            </div>
                            <span className="font-bold text-xl tracking-tight">OpsNexus</span>
                        </div>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
                        <p className="text-slate-400 mt-1">Monitor your infrastructure and support tickets.</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-green-500/20 transition-all active:scale-95"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Excel Report
                    </button>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Nagios Alerts</p>
                                <h3 className="text-3xl font-bold text-white">{data?.alerts_count}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                <Ticket className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Optimum Tickets</p>
                                <h3 className="text-3xl font-bold text-white">{data?.tickets_count}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs/Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Alerts Table */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-700">
                            <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                                    <tr>
                                        <th className="px-6 py-3">Host</th>
                                        <th className="px-6 py-3">Service</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {data?.alerts.slice(0, 5).map((alert) => (
                                        <tr key={alert.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{alert.host}</td>
                                            <td className="px-6 py-4 text-slate-300">{alert.service}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${alert.status === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                                                    alert.status === 'WARNING' ? 'bg-yellow-500/10 text-yellow-400' :
                                                        'bg-green-500/10 text-green-400'
                                                    }`}>
                                                    {alert.status === 'CRITICAL' ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                                    {alert.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {data?.alerts.length === 0 && (
                                        <tr><td colSpan="3" className="px-6 py-4 text-center text-slate-500">No alerts found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tickets Table */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-700">
                            <h3 className="text-lg font-semibold text-white">Recent Tickets</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                                    <tr>
                                        <th className="px-6 py-3">Subject</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {data?.tickets.slice(0, 5).map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{ticket.subject}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ticket.status === 'Open' ? 'bg-blue-500/10 text-blue-400' :
                                                    ticket.status === 'Resolved' ? 'bg-green-500/10 text-green-400' :
                                                        'bg-slate-500/10 text-slate-400'
                                                    }`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {data?.tickets.length === 0 && (
                                        <tr><td colSpan="2" className="px-6 py-4 text-center text-slate-500">No tickets found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
