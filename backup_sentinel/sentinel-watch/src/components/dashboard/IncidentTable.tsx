import React from 'react';
import {
  MapPin,
  ThumbsUp,
  Clock,
  Eye,
  CheckCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Incident, IncidentSeverity } from '@/types/emergency';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface IncidentTableProps {
  incidents: Incident[];
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  onViewIncident: (incident: Incident) => void;
  onVerifyIncident: (id: string) => void;
}

const severityVariants: Record<
  IncidentSeverity,
  'critical' | 'high' | 'medium' | 'low' | 'outline' | 'default' | 'secondary' | 'destructive'
> = {
  CRITICAL: 'destructive',
  HIGH: 'default',
  MEDIUM: 'secondary',
  LOW: 'outline',
};

const IncidentTable: React.FC<IncidentTableProps> = ({
  incidents,
  selectedIds,
  onSelectIds,
  onViewIncident,
  onVerifyIncident,
}) => {
  const toggleSelectAll = () => {
    onSelectIds(
      selectedIds.length === incidents.length
        ? []
        : incidents.map((i) => i.id)
    );
  };

  const toggleSelect = (id: string) => {
    selectedIds.includes(id)
      ? onSelectIds(selectedIds.filter((i) => i !== id))
      : onSelectIds([...selectedIds, id]);
  };

  const sortedIncidents = [...incidents].sort((a, b) => {
    // Verified items at the bottom
    if (a.status === 'VERIFIED' && b.status !== 'VERIFIED') return 1;
    if (a.status !== 'VERIFIED' && b.status === 'VERIFIED') return -1;

    // Critical first
    if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
    if (b.severity === 'CRITICAL' && a.severity !== 'CRITICAL') return 1;

    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const safeDate = (date: Date | string | undefined) => {
    if (!date) return 'Just now';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return 'Just now';
      return formatDistanceToNow(d, { addSuffix: true });
    } catch (e) {
      return 'Just now';
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="relative w-full overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50 border-b border-border">
              <TableHead className="w-[50px] text-center">
                <Checkbox
                  checked={incidents.length > 0 && selectedIds.length === incidents.length}
                  onCheckedChange={toggleSelectAll}
                  className="translate-y-[2px]"
                />
              </TableHead>
              <TableHead className="w-[80px] font-semibold text-xs uppercase tracking-wider">ID</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Title</TableHead>
              <TableHead className="w-[100px] text-center font-semibold text-xs uppercase tracking-wider text-center">Severity</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Location</TableHead>
              <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider">Reported</TableHead>
              <TableHead className="w-[60px] text-center font-semibold text-xs uppercase tracking-wider text-center px-1">Votes</TableHead>
              <TableHead className="w-[160px] text-center font-semibold text-xs uppercase tracking-wider text-center px-1 pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No incidents found.
                </TableCell>
              </TableRow>
            ) : (
              sortedIncidents.map((incident) => (
                <TableRow
                  key={incident.id}
                  className={cn(
                    "group transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                    incident.status === 'VERIFIED' && "bg-muted/10"
                  )}
                  data-state={selectedIds.includes(incident.id) ? "selected" : undefined}
                >
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedIds.includes(incident.id)}
                      onCheckedChange={() => toggleSelect(incident.id)}
                      className="translate-y-[2px]"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground font-medium whitespace-nowrap">
                    {incident.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-foreground truncate max-w-[280px]">
                        {incident.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {incident.type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={severityVariants[incident.severity] || 'outline'}
                      className={cn(
                        "text-[10px] px-2.5 py-0.5 shadow-none border font-semibold",
                        incident.severity === 'CRITICAL' && "animate-pulse"
                      )}
                    >
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-[200px]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{incident.location?.area || 'Unknown Area'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{safeDate(incident.createdAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center px-1">
                    <div className="flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {incident.upvotes}
                    </div>
                  </TableCell>
                  <TableCell className="px-1 pr-6">
                    <div className="flex items-center justify-center gap-1.5 transition-all duration-200 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => onViewIncident(incident)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant={incident.status === 'VERIFIED' ? "ghost" : "default"}
                        size="sm"
                        className={cn(
                          "h-7 px-2 text-[10px] font-medium shadow-sm transition-all",
                          incident.status === 'VERIFIED'
                            ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                        )}
                        onClick={() => onVerifyIncident(incident.id)}
                        disabled={incident.status === 'VERIFIED'}
                      >
                        {incident.status === 'VERIFIED' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" /> Verified
                          </>
                        ) : "Verify"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </div>
    </div>
  );
};

export default IncidentTable;
