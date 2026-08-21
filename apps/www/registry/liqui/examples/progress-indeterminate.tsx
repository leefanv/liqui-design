'use client';

import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from '@/registry/liqui/ui/progress';

export default function ProgressIndeterminate() {
  return (
    <Progress className="w-72" value={null}>
      <div className="flex items-baseline justify-between">
        <ProgressLabel>Looking for devices</ProgressLabel>
        <ProgressValue>{() => 'Searching…'}</ProgressValue>
      </div>
      <ProgressTrack />
    </Progress>
  );
}
