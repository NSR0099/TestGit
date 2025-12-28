import React from 'react';
import PopupModal from './PopupModal';
import { User } from '@/types/emergency';
import { Button } from '@/components/ui/button';

interface ProfilePopupProps {
  open: boolean;
  onClose: () => void;
  user: User;
}

const ProfilePopup: React.FC<ProfilePopupProps> = ({
  open,
  onClose,
  user,
}) => {
  return (
    <PopupModal open={open} onClose={onClose} title="My Profile">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-semibold">
          {user.name?.charAt(0) ?? 'U'}
        </div>

        <div>
          <p className="text-lg font-semibold text-foreground">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
            {user.role}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 text-sm">
        <Detail label="User ID" value={user.id ?? '—'} />
        <Detail label="Account Status" value="Active" />
        <Detail label="Last Login" value="Just now" />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline">Change Password</Button>
        <Button>Edit Profile</Button>
      </div>
    </PopupModal>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

export default ProfilePopup;
