import React from 'react';
import { SpeakingCityModal } from './SpeakingCityModal';

interface VoicePathModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAwardReward?: (xp: number, gems: number, speechScore: number) => void;
  onOpenSultiChat?: (prefillPrompt?: string) => void;
  targetDialect?: string;
}

export const VoicePathModal: React.FC<VoicePathModalProps> = ({
  isOpen,
  onClose,
  onAwardReward,
  onOpenSultiChat,
}) => {
  return (
    <SpeakingCityModal
      isOpen={isOpen}
      onClose={onClose}
      onAwardReward={onAwardReward}
      onOpenSultiChat={onOpenSultiChat}
    />
  );
};
