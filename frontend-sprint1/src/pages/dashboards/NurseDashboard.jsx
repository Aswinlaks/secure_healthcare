import { ClipboardList, Activity, Clock, UserCheck } from 'lucide-react';

const NurseDashboard = () => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5 flex items-center">
                        <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                            <ClipboardList className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-500 truncate">Assigned Patients</dt>
                                <dd className="text-lg font-medium text-slate-900">12</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5 flex items-center">
                        <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                            <Activity className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-500 truncate">Critical Alerts</dt>
                                <dd className="text-lg font-medium text-slate-900">2</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5 flex items-center">
                        <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                            <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-500 truncate">Rounds Complete</dt>
                                <dd className="text-lg font-medium text-slate-900">85%</dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5 flex items-center">
                        <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-slate-500 truncate">Shift Remaining</dt>
                                <dd className="text-lg font-medium text-slate-900">3h 20m</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tasks / Rounds */}
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Upcoming Rounds / Meds</h3>
                </div>
                <ul className="divide-y divide-slate-200">
                    {[1, 2, 3].map(i => (
                        <li key={i} className="px-4 py-4 sm:px-6 hover:bg-slate-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Room 30{i} - Bed 1</p>
                                    <p className="text-sm text-slate-500">Medication: Insulin 10 units</p>
                                </div>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Due in {i * 15} mins
                                    </span>
                                    <button className="ml-4 text-primary-600 hover:text-primary-900 text-sm font-medium">Log Vitals</button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default NurseDashboard;
