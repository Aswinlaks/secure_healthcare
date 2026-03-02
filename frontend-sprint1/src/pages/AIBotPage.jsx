import AIBotPanel from '../components/aiBot/AIBotPanel';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000'; // Match backend config

function AIBotPage() {
    return (
        <div className="space-y-4">
            {/* Back Navigation */}
            <div>
                <Link
                    to="/dashboard"
                    className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Dashboard
                </Link>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        AI Care Advisor
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Upload your diagnosis file to get an AI-generated personalized care and diet plan.
                    </p>
                </div>
            </div>

            <AIBotPanel apiBase={API_BASE_URL} />
        </div>
    );
}

export default AIBotPage;
