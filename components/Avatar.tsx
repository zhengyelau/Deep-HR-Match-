import React, { useState } from 'react';
import { getCandidateAvatar } from '../utils/avatarGenerator';

interface AvatarProps {
  candidateId: number;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-lg',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 text-2xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  candidateId,
  firstName,
  lastName,
  profilePictureUrl,
  size = 'lg',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = getCandidateAvatar(profilePictureUrl, candidateId);
  const initials = `${firstName[0]}${lastName[0]}`;

  const showInitials = !avatarUrl || imageError;

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md overflow-hidden ${className}`}>
      {!showInitials && avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${firstName} ${lastName}`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
