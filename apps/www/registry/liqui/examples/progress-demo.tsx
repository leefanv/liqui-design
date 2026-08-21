'use client';

import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from '@/registry/liqui/ui/progress';

export default function ProgressDemo() {
  return (
    <div className="flex w-72 flex-col gap-6">
      <Progress value={24}>
        <div className="flex items-baseline justify-between">
          <ProgressLabel>Uploading</ProgressLabel>
          <ProgressValue />
        </div>
        <ProgressTrack />
      </Progress>

      <Progress value={68}>
        <div className="flex items-baseline justify-between">
          <ProgressLabel>Rendering</ProgressLabel>
          <ProgressValue />
        </div>
        <ProgressTrack />
      </Progress>

      <Progress value={100}>
        <div className="flex items-baseline justify-between">
          <ProgressLabel>Sync</ProgressLabel>
          <ProgressValue>{() => 'Done'}</ProgressValue>
        </div>
        <ProgressTrack />
      </Progress>
    </div>
  );
}
