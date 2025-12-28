import React from 'react';
import { AlertCircle, Clock, CheckCircle2, Shield } from 'lucide-react';
import { useEmergency } from '@/contexts/EmergencyContext';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'critical' | 'warning' | 'success' | 'info';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick }) => {
  const colorClasses = {
    critical: 'border-severity-critical/30 bg-severity-critical/5 hover:bg-severity-critical/10',
    warning: 'border-severity-medium/30 bg-severity-medium/5 hover:bg-severity-medium/10',
    success: 'border-status-online/30 bg-status-online/5 hover:bg-status-online/10',
    info: 'border-primary/30 bg-primary/5 hover:bg-primary/10',
  };

  const iconColors = {
    critical: 'text-severity-critical',
    warning: 'text-severity-medium',
    success: 'text-status-online',
    info: 'text-primary',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 min-w-[160px] p-4 rounded-xl border transition-all duration-200",
        "flex items-center gap-4 text-left",
        colorClasses[color]
      )}
    >
      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", `bg-${color}/10`)}>
        <div className={iconColors[color]}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </button>
  );
};

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Bot } from 'lucide-react';

// ... (StatCard component remains same)

const DashboardStats: React.FC = () => {
  const { dashboardStats, incidents } = useEmergency();
  const [showAiReport, setShowAiReport] = React.useState(false);
  const [aiText, setAiText] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  const generateReport = () => {
    setShowAiReport(true);
    setIsTyping(true);
    setAiText('');

    const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
    const highCount = incidents.filter(i => i.severity === 'HIGH').length;
    const topArea = incidents.length > 0 ? incidents[0].location?.area : 'Unknown';

    const fullText = `SITUATION REPORT ${new Date().toLocaleTimeString()}
      
SUMMARY:
Current threat level is MODERATE. System is tracking ${dashboardStats.totalActive} active incidents.
CRITICAL ALERT: ${criticalCount} critical incidents require immediate attention.
HOTSPOT ANALYSIS: High volume of reports in ${topArea}.

RECOMMENDED ACTIONS:
1. Dispatch available units to ${topArea} sector.
2. Verify pending reports (${dashboardStats.unverified} in queue).
3. Alert local medical services for potential high-casualty events.

AI PREDICTION:
Probability of secondary incidents in next hour: 65%. Suggest increasing patrol density.`;

    let i = 0;
    const typeInterval = setInterval(() => {
      setAiText(current => current + fullText.charAt(i));
      i++;
      if (i >= fullText.length) {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 20);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap gap-4">
        <StatCard
          title="Active Incidents"
          value={dashboardStats.totalActive}
          icon={<AlertCircle className="w-6 h-6" />}
          color="critical"
        />
        <StatCard
          title="Pending Verification"
          value={incidents.filter(i => i.status === 'UNVERIFIED').length}
          icon={<Clock className="w-6 h-6" />}
          color="warning"
        />
        <StatCard
          title="In Progress"
          value={dashboardStats.verifiedInProgress}
          icon={<Shield className="w-6 h-6" />}
          color="info"
        />
        <StatCard
          title="Resolved Today"
          value={dashboardStats?.resolvedToday || 0}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="success"
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={generateReport}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg border-0"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate AI Situation Report
        </Button>
      </div>

      <Dialog open={showAiReport} onOpenChange={setShowAiReport}>
        <DialogContent className="max-w-2xl bg-black/90 border-slate-800 text-green-500 font-mono shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400">
              <Bot className="w-5 h-5" />
              SENTINEL AI PROTOCOL v2.4
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-[300px] p-4 rounded bg-slate-950/50 border border-green-500/20 whitespace-pre-line leading-relaxed">
            {aiText}
            {isTyping && <span className="animate-pulse">_</span>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardStats;
