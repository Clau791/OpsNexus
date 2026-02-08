import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchDashboardData, exportExcel, fetchReports } from '../services/api';
import { AlertCircle, Ticket, LogOut, CheckCircle, XCircle, FileSpreadsheet, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        try {
            const [dashboardResult, reportsResult] = await Promise.all([
                fetchDashboardData(),
                fetchReports(),
            ]);
            setData(dashboardResult);
            setReports(reportsResult?.reports || []);
        } catch (err) {
            console.error("Failed to fetch data", err);
            // If unauthorized, redirect to login
            if (err.response && err.response.status === 401) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

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

    const alertStatusSeries = useMemo(() => {
        const counts = { CRITICAL: 0, WARNING: 0, OK: 0, UNKNOWN: 0 };
        for (const alert of data?.alerts || []) {
            const key = String(alert.status || '').toUpperCase();
            if (key in counts) counts[key] += 1;
        }
        return [
            { label: 'CRITICAL', value: counts.CRITICAL, dotClass: 'bg-red-400' },
            { label: 'WARNING', value: counts.WARNING, dotClass: 'bg-yellow-400' },
            { label: 'OK', value: counts.OK, dotClass: 'bg-green-400' },
            { label: 'UNKNOWN', value: counts.UNKNOWN, dotClass: 'bg-slate-400' },
        ];
    }, [data]);

    const ticketStatusSeries = useMemo(() => {
        const counts = { Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 };
        for (const ticket of data?.tickets || []) {
            const key = String(ticket.status || '');
            if (key in counts) counts[key] += 1;
        }
        return [
            { label: 'Open', value: counts.Open, barClass: 'bg-blue-400' },
            { label: 'In Progress', value: counts['In Progress'], barClass: 'bg-yellow-400' },
            { label: 'Resolved', value: counts.Resolved, barClass: 'bg-green-400' },
            { label: 'Closed', value: counts.Closed, barClass: 'bg-slate-400' },
        ];
    }, [data]);

    const totalAlerts = alertStatusSeries.reduce((sum, item) => sum + item.value, 0);
    const maxTicketValue = Math.max(1, ...ticketStatusSeries.map((item) => item.value));

    const donutSegments = useMemo(() => {
        const circumference = 2 * Math.PI * 40;
        let progress = 0;
        return alertStatusSeries.map((item) => {
            const fraction = totalAlerts ? item.value / totalAlerts : 0;
            const segment = {
                ...item,
                dash: fraction * circumference,
                offset: -progress * circumference,
            };
            progress += fraction;
            return segment;
        });
    }, [alertStatusSeries, totalAlerts]);

    const reportChart = useMemo(() => {
        const sorted = [...reports]
            .sort((a, b) => new Date(a.generated_at).getTime() - new Date(b.generated_at).getTime())
            .slice(-6);

        if (!sorted.length) {
            return {
                width: 320,
                height: 140,
                points: '',
                area: '',
                coords: [],
                avg: 0,
                last: 0,
            };
        }

        const width = 320;
        const height = 140;
        const pad = 14;
        const innerW = width - pad * 2;
        const innerH = height - pad * 2;
        const values = sorted.map((r) => Number(r.score) || 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = Math.max(1, max - min);

        const coords = sorted.map((report, idx) => {
            const x = pad + (sorted.length === 1 ? innerW / 2 : (idx * innerW) / (sorted.length - 1));
            const y = pad + ((max - (Number(report.score) || 0)) / range) * innerH;
            return {
                x,
                y,
                label: report.id,
                score: Number(report.score) || 0,
            };
        });

        const points = coords.map((p) => `${p.x},${p.y}`).join(' ');
        const area = `${pad},${height - pad} ${points} ${pad + innerW},${height - pad}`;
        const avg = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
        const last = values[values.length - 1];

        return { width, height, points, area, coords, avg, last };
    }, [reports]);

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Generated Reports</p>
                                <h3 className="text-3xl font-bold text-white">{reports.length}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Alert Status Mix</h3>
                            <span className="text-xs text-slate-400">live split</span>
                        </div>
                        <div className="mt-5 flex items-center gap-5">
                            <div className="relative h-32 w-32 shrink-0">
                                <svg viewBox="0 0 100 100" className="h-32 w-32">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="10" />
                                    {donutSegments.filter((segment) => segment.value > 0).map((segment) => (
                                        <circle
                                            key={segment.label}
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            strokeWidth="10"
                                            strokeDasharray={`${segment.dash} 251.2`}
                                            strokeDashoffset={segment.offset}
                                            strokeLinecap="round"
                                            transform="rotate(-90 50 50)"
                                            className={
                                                segment.label === 'CRITICAL'
                                                    ? 'stroke-red-400'
                                                    : segment.label === 'WARNING'
                                                        ? 'stroke-yellow-400'
                                                        : segment.label === 'OK'
                                                            ? 'stroke-green-400'
                                                            : 'stroke-slate-400'
                                            }
                                        />
                                    ))}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-2xl font-bold text-white">{totalAlerts}</div>
                                    <div className="text-[11px] text-slate-400">alerts</div>
                                </div>
                            </div>
                            <div className="w-full space-y-2">
                                {alertStatusSeries.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <span className={`h-2.5 w-2.5 rounded-full ${item.dotClass}`} />
                                            {item.label}
                                        </div>
                                        <span className="font-semibold text-slate-100">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Ticket Flow</h3>
                            <span className="text-xs text-slate-400">by status</span>
                        </div>
                        <div className="mt-5 space-y-4">
                            {ticketStatusSeries.map((item) => {
                                const rawPct = (item.value / maxTicketValue) * 100;
                                const widthPct = item.value === 0 ? 0 : Math.max(8, rawPct);
                                return (
                                    <div key={item.label}>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-300">{item.label}</span>
                                            <span className="font-semibold text-slate-100">{item.value}</span>
                                        </div>
                                        <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-700/70 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${item.barClass}`}
                                                style={{ width: `${widthPct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Report Score Trend</h3>
                            <span className="text-xs text-slate-400">last 6 reports</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                            Avg score: <span className="text-slate-200 font-semibold">{reportChart.avg}</span> • Latest: <span className="text-slate-200 font-semibold">{reportChart.last}</span>
                        </div>
                        <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-900/40 p-2">
                            <svg viewBox={`0 0 ${reportChart.width} ${reportChart.height}`} className="w-full h-36">
                                <line x1="0" y1="35" x2={reportChart.width} y2="35" stroke="#334155" strokeWidth="1" />
                                <line x1="0" y1="70" x2={reportChart.width} y2="70" stroke="#334155" strokeWidth="1" />
                                <line x1="0" y1="105" x2={reportChart.width} y2="105" stroke="#334155" strokeWidth="1" />
                                {reportChart.points ? (
                                    <>
                                        <polygon points={reportChart.area} fill="rgba(59,130,246,0.16)" />
                                        <polyline
                                            fill="none"
                                            stroke="#60a5fa"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            points={reportChart.points}
                                        />
                                        {reportChart.coords.map((point) => (
                                            <circle key={point.label} cx={point.x} cy={point.y} r="3.5" fill="#93c5fd" />
                                        ))}
                                    </>
                                ) : null}
                            </svg>
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

                <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h3 className="text-lg font-semibold text-white">Fictive Reports (API Simulation)</h3>
                        <p className="text-slate-400 text-sm mt-1">Rapoarte demo încărcate prin endpoint-ul `/api/reports`.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3">Report</th>
                                    <th className="px-6 py-3">Client</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Risk</th>
                                    <th className="px-6 py-3">Score</th>
                                    <th className="px-6 py-3">Generated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {reports.slice(0, 6).map((report) => (
                                    <tr key={report.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{report.title}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{report.id} • {report.source}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{report.client}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                report.status === 'READY'
                                                    ? 'bg-green-500/10 text-green-400'
                                                    : report.status === 'IN_REVIEW'
                                                        ? 'bg-yellow-500/10 text-yellow-400'
                                                        : 'bg-slate-500/10 text-slate-400'
                                            }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                report.risk_level === 'HIGH'
                                                    ? 'bg-red-500/10 text-red-400'
                                                    : report.risk_level === 'MEDIUM'
                                                        ? 'bg-yellow-500/10 text-yellow-400'
                                                        : 'bg-green-500/10 text-green-400'
                                            }`}>
                                                {report.risk_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-200 font-semibold">{report.score}</td>
                                        <td className="px-6 py-4 text-slate-400">{new Date(report.generated_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {reports.length === 0 && (
                                    <tr><td colSpan="6" className="px-6 py-4 text-center text-slate-500">No reports found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
