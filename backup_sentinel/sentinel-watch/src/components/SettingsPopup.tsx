import React from 'react';
import PopupModal from './PopupModal';
import { User } from '@/types/emergency';
import { Switch } from '@/components/ui/switch';

interface SettingsPopupProps {
  open: boolean;
  onClose: () => void;
  user: User;
}

const SettingsPopup: React.FC<SettingsPopupProps> = ({
  open,
  onClose,
  user,
}) => {
  return (
    <PopupModal open={open} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* GENERAL */}
        <Section title="General">
          <SettingRow label="Sound Alerts" desc="Play sound for notifications" defaultChecked />
        </Section>

        {/* ADMIN */}
        {user.role === 'ADMIN' && (
          <Section title="Admin Controls">
            <SettingRow
              label="Auto Verify Incidents"
              desc="Automatically verify trusted reports"
            />
            <SettingRow
              label="AI Assignment"
              desc="Enable smart responder allocation"
              defaultChecked
            />
            <SettingRow
              label="System Maintenance Mode"
              desc="Restrict responder actions temporarily"
            />
          </Section>
        )}

        {/* RESPONDER */}
        {user.role === 'RESPONDER' && (
          <Section title="Responder Preferences">
            <SettingRow
              label="Available for Duty"
              desc="Mark yourself as available"
              defaultChecked
            />
            <SettingRow
              label="Live Location Sharing"
              desc="Share location with command center"
              defaultChecked
            />
            <SettingRow
              label="High Priority Alerts"
              desc="Receive critical alerts only"
            />
          </Section>
        )}

        {/* USER */}
        {user.role === 'USER' && (
          <Section title="User Preferences">
            <SettingRow
              label="Incident Updates"
              desc="Receive updates on reported incidents"
              defaultChecked
            />
            <SettingRow
              label="Email Notifications"
              desc="Get email alerts"
            />
          </Section>
        )}
      </div>
    </PopupModal>
  );
};

/* ---------- Helpers ---------- */

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
    <div className="space-y-3">{children}</div>
  </div>
);

const SettingRow = ({
  label,
  desc,
  defaultChecked = false,
}: {
  label: string;
  desc: string;
  defaultChecked?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    <Switch defaultChecked={defaultChecked} />
  </div>
);

export default SettingsPopup;
