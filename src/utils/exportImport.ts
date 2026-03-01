import type { BoardObject } from '../types';
import type { RefObject } from 'react';
import type Konva from 'konva';

export function exportBoardToJSON(objects: BoardObject[], boardName: string) {
  const data = JSON.stringify({ boardName, objects }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${boardName.replace(/\s+/g, '_')}_board.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBoardFromJSON(): Promise<BoardObject[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return reject(new Error('No file selected'));
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          const objects: BoardObject[] = parsed.objects || parsed;
          resolve(objects);
        } catch {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

export function exportBoardToPNG(stageRef: RefObject<Konva.Stage | null>, boardName: string) {
  if (!stageRef.current) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stage = stageRef.current as any;
  const dataURL = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png', background: '#dde3ea' });
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = `${boardName.replace(/\s+/g, '_')}_board.png`;
  a.click();
}
