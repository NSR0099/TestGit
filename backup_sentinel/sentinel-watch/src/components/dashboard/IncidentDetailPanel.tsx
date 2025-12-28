import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  User,
  ThumbsUp,
  CheckCircle,
  XCircle,
  ImageIcon,
  AlertTriangle,
  FileText,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Incident, IncidentStatus, IncidentSeverity, Department } from '@/types/emergency';
import { useEmergency } from '@/contexts/EmergencyContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface IncidentDetailPanelProps {
  incident: Incident;
  onClose: () => void;
}

const severityOptions: IncidentSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const statusOptions: IncidentStatus[] = ['UNVERIFIED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
const departmentOptions: { value: Department; label: string }[] = [
  { value: 'POLICE', label: 'Police' },
  { value: 'AMBULANCE', label: 'Ambulance' },
  { value: 'FIRE_DEPARTMENT', label: 'Fire Department' },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
];

const IncidentDetailPanel: React.FC<IncidentDetailPanelProps> = ({ incident, onClose }) => {
  if (!incident) return null;

  const {
    updateIncidentStatus,
    updateIncidentSeverity,
    updateIncidentDepartment,
    verifyIncident,
    markAsFalse,
    addAdminNote,
    adminNotes,
  } = useEmergency();

  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'activity'>('overview');
  const [showConfirmDialog, setShowConfirmDialog] = useState<'verify' | 'false' | null>(null);
  const [newNote, setNewNote] = useState('');
  const [falseReason, setFalseReason] = useState('');

  const incidentNotes = adminNotes.filter(n => n.incidentId === incident.id);

  const handleVerify = () => {
    verifyIncident(incident.id);
    setShowConfirmDialog(null);
    toast.success('Incident verified');
  };

  const handleMarkFalse = () => {
    markAsFalse(incident.id, falseReason);
    setShowConfirmDialog(null);
    toast.success('Marked as false report');
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addAdminNote(incident.id, newNote);
    setNewNote('');
    toast.success('Note added');
  };

  const getSeverityColor = (s: IncidentSeverity) => {
    switch (s) {
      case 'CRITICAL': return 'bg-red-500 hover:bg-red-600 border-red-600';
      case 'HIGH': return 'bg-orange-500 hover:bg-orange-600 border-orange-600';
      case 'MEDIUM': return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600';
      case 'LOW': return 'bg-green-500 hover:bg-green-600 border-green-600';
      default: return 'bg-slate-500';
    }
  };

  const safeDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return 'Invalid Date';
      return formatDistanceToNow(d, { addSuffix: true });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full max-w-[850px] bg-background/95 backdrop-blur-md border-l shadow-2xl z-50 animate-slide-in flex flex-col font-sans">
        {/* Header */}
        <div className="flex flex-col border-b bg-card/40">
          <div className="px-6 py-4 flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <Badge className={`${getSeverityColor(incident.severity)} text-white border-0 px-2.5 py-0.5 pointer-events-none`}>
                  {incident.severity}
                </Badge>
                <div className="flex items-center text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border">
                  ID: <span className="select-all ml-1 text-foreground font-medium">{incident.id}</span>
                </div>
                {incident.status === 'VERIFIED' && (
                  <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-500/5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> VERIFIED
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground leading-tight max-w-[600px]">{incident.title}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 hover:bg-muted -mr-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Control Bar */}
          <div className="px-6 pb-4 pt-0 grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
              <Select value={incident.status} onValueChange={(v) => updateIncidentStatus(incident.id, v as IncidentStatus)}>
                <SelectTrigger className="h-8 text-xs bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assigned To</label>
              <Select value={incident.assignedDepartment || undefined} onValueChange={(v) => updateIncidentDepartment(incident.id, v)}>
                <SelectTrigger className="h-8 text-xs bg-background/50">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Priority Level</label>
              <Select value={incident.severity} onValueChange={(v) => updateIncidentSeverity(incident.id, v as IncidentSeverity)}>
                <SelectTrigger className="h-8 text-xs bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Manual Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 pt-2 border-b bg-muted/10">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground/80'
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('evidence')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'evidence'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground/80'
                  }`}
              >
                Evidence ({incident.media?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activity'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground/80'
                  }`}
              >
                Activity & Notes
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-muted/5 p-6">
            {activeTab === 'overview' && (
              <div className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Left Column: Description & Metadata */}
                  <div className="md:col-span-3 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileText className="w-4 h-4 text-primary" />
                        Description
                      </div>
                      <div className="p-4 rounded-lg border bg-card text-sm leading-relaxed text-muted-foreground shadow-sm">
                        {incident.description || <span className="italic text-muted-foreground/50">No description provided for this incident.</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-card rounded-lg border flex flex-col gap-1 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Reported By</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <User className="w-3.5 h-3.5 text-primary/70" />
                          {incident.reporterAnonymous ? 'Anonymous' : (incident.reporterId?.split('-')[0] || 'Unknown')}
                        </div>
                      </div>
                      <div className="p-3 bg-card rounded-lg border flex flex-col gap-1 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Reported Time</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="w-3.5 h-3.5 text-primary/70" />
                          {safeDate(incident.createdAt)}
                        </div>
                      </div>
                      <div className="p-3 bg-card rounded-lg border flex flex-col gap-1 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Incident Type</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-primary/70" />
                          {incident.type}
                        </div>
                      </div>
                      <div className="p-3 bg-card rounded-lg border flex flex-col gap-1 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Verification Score</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ThumbsUp className="w-3.5 h-3.5 text-primary/70" />
                          {incident.upvotes} Upvotes
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Map & Location */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      Location
                    </div>
                    <div className="rounded-xl border overflow-hidden shadow-sm bg-card">
                      <div className="h-[200px] w-full bg-muted relative">
                        <iframe
                          title="map"
                          width="100%"
                          height="100%"
                          className="grayscale-[0.2]"
                          style={{ border: 0 }}
                          loading="lazy"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${(incident.location?.lng || 0) - 0.005}%2C${(incident.location?.lat || 0) - 0.005}%2C${(incident.location?.lng || 0) + 0.005}%2C${(incident.location?.lat || 0) + 0.005}&layer=mapnik&marker=${incident.location?.lat || 0}%2C${incident.location?.lng || 0}`}
                        />
                      </div>
                      <div className="p-3 border-t bg-card/50">
                        <p className="text-xs text-foreground font-medium flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                          {incident.location?.address || 'Unknown Location'}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 pl-5">
                          Lat: {incident.location?.lat?.toFixed(4) || 0}, Lng: {incident.location?.lng?.toFixed(4) || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="mt-0 h-full animate-in fade-in-50 duration-300">
                {(!incident.media || incident.media.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-[300px] rounded-xl border-2 border-dashed bg-card/50 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 opacity-20 mb-3" />
                    <p className="text-sm font-medium">No media evidence provided</p>
                    <p className="text-xs text-muted-foreground/60">Photos or videos uploaded by reporters will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {incident.media.map((url, i) => (
                      <div key={i} className="group relative aspect-video rounded-xl border bg-black shadow-sm overflow-hidden cursor-zoom-in">
                        <img
                          src={url}
                          alt={`Evidence ${i}`}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-white font-medium">Evidence #{i + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="mt-0 space-y-4 animate-in fade-in-50 duration-300">
                {/* Add Note Input */}
                <div className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Add Internal Log</label>
                  <div className="flex gap-2">
                    <Textarea
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      placeholder="Type a note for the responders..."
                      className="min-h-[60px] resize-none text-sm bg-muted/40"
                    />
                    <Button size="icon" className="h-[60px] w-[60px] shrink-0" onClick={handleAddNote} disabled={!newNote.trim()}>
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-0 before:w-px before:bg-border">
                  {incidentNotes.length === 0 && (
                    <div className="pl-10 py-8 text-sm text-muted-foreground italic">No activity logged yet.</div>
                  )}
                  {[...incidentNotes].reverse().map(note => (
                    <div key={note.id} className="relative pl-10 group">
                      <div className="absolute left-2 top-3 w-4 h-4 rounded-full border-2 border-background bg-muted-foreground/20 group-hover:bg-primary group-hover:scale-110 transition-all z-10" />
                      <div className="p-4 rounded-lg border bg-card shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-primary">{note.authorName}</span>
                          <span className="text-[10px] text-muted-foreground">{safeDate(note.createdAt)}</span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t bg-background/95 backdrop-blur shadow-up z-20">
          <div className="flex gap-4">
            {incident.status !== 'VERIFIED' ? (
              <>
                <Button variant="outline" className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setShowConfirmDialog('false')}>
                  <XCircle className="w-4 h-4 mr-2" /> Mark as False
                </Button>
                <Button className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowConfirmDialog('verify')}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Verify & Dispatch
                </Button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-3 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                <CheckCircle className="w-5 h-5 mr-2" /> This incident has been verified and assigned.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={showConfirmDialog === 'verify'} onOpenChange={() => setShowConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Incident</AlertDialogTitle>
            <AlertDialogDescription>Validate this incident as real?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVerify} className="bg-emerald-600 hover:bg-emerald-700">Confirm Verification</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmDialog === 'false'} onOpenChange={() => setShowConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark False</AlertDialogTitle>
            <AlertDialogDescription>Reason for marking as false?</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={falseReason} onChange={e => setFalseReason(e.target.value)} placeholder="E.g. Duplicate report, Test data..." className="mt-2" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkFalse} className="bg-destructive hover:bg-destructive/90">Mark False</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default IncidentDetailPanel;
