export interface BoardObject {
  id: string;
  type: 'text' | 'card' | 'rectangle' | 'image' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  imageSrc?: string;
  // Arrow-specific fields
  fromId?: string;
  toId?: string;
  style?: {
    background?: string;
    color?: string;
    arrowColor?: string;
  };
}

export interface BoardMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface BoardData {
  objects: BoardObject[];
  history: BoardObject[][];
  historyIndex: number;
}

export interface AppStorage {
  boardsMeta: BoardMeta[];
  boardsData: { [boardId: string]: BoardData };
  currentBoardId: string | null;
}
