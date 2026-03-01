import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AppStorage, BoardMeta, BoardObject, BoardData } from '../types';

const STORAGE_KEY = 'ai-board-app';
const MAX_HISTORY = 20;

function loadStorage(): AppStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppStorage;
  } catch {}
  return { boardsMeta: [], boardsData: {}, currentBoardId: null };
}

function saveStorage(storage: AppStorage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch {}
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function debounceSave(storage: AppStorage) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => saveStorage(storage), 300);
}

interface AppState {
  boardsMeta: BoardMeta[];
  currentBoardId: string | null;
  currentBoardData: BoardData | null;

  // Board manager actions
  loadApp: () => void;
  createBoard: () => void;
  deleteBoard: (id: string) => void;
  renameBoard: (id: string, name: string) => void;
  duplicateBoard: (id: string) => void;
  selectBoard: (id: string) => void;
  goToBoardManager: () => void;

  // Board actions
  addObject: (obj: Omit<BoardObject, 'id'>) => void;
  updateObject: (id: string, changes: Partial<BoardObject>) => void;
  deleteObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  clearBoard: () => void;
  undo: () => void;
  redo: () => void;
  importObjects: (objects: BoardObject[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  boardsMeta: [],
  currentBoardId: null,
  currentBoardData: null,

  loadApp: () => {
    const storage = loadStorage();

    if (storage.boardsMeta.length === 0) {
      // Create first board automatically
      const id = uuidv4();
      const now = Date.now();
      const meta: BoardMeta = { id, name: 'Моя первая доска', createdAt: now, updatedAt: now };
      const data: BoardData = { objects: [], history: [[]], historyIndex: 0 };
      storage.boardsMeta = [meta];
      storage.boardsData[id] = data;
      storage.currentBoardId = null;
      saveStorage(storage);
    }

    set({ boardsMeta: storage.boardsMeta, currentBoardId: null, currentBoardData: null });
  },

  createBoard: () => {
    const id = uuidv4();
    const now = Date.now();
    const meta: BoardMeta = { id, name: `Доска ${get().boardsMeta.length + 1}`, createdAt: now, updatedAt: now };
    const data: BoardData = { objects: [], history: [[]], historyIndex: 0 };

    const storage = loadStorage();
    storage.boardsMeta.push(meta);
    storage.boardsData[id] = data;
    saveStorage(storage);

    set(state => ({ boardsMeta: [...state.boardsMeta, meta] }));
  },

  deleteBoard: (id) => {
    const storage = loadStorage();
    storage.boardsMeta = storage.boardsMeta.filter(b => b.id !== id);
    delete storage.boardsData[id];
    saveStorage(storage);

    set(state => ({
      boardsMeta: state.boardsMeta.filter(b => b.id !== id),
      currentBoardId: state.currentBoardId === id ? null : state.currentBoardId,
      currentBoardData: state.currentBoardId === id ? null : state.currentBoardData,
    }));
  },

  renameBoard: (id, name) => {
    const storage = loadStorage();
    const meta = storage.boardsMeta.find(b => b.id === id);
    if (meta) {
      meta.name = name;
      meta.updatedAt = Date.now();
      saveStorage(storage);
    }

    set(state => ({
      boardsMeta: state.boardsMeta.map(b => b.id === id ? { ...b, name, updatedAt: Date.now() } : b),
    }));
  },

  duplicateBoard: (id) => {
    const storage = loadStorage();
    const srcMeta = storage.boardsMeta.find(b => b.id === id);
    const srcData = storage.boardsData[id];
    if (!srcMeta || !srcData) return;

    const newId = uuidv4();
    const now = Date.now();
    const newMeta: BoardMeta = { id: newId, name: `${srcMeta.name} (копия)`, createdAt: now, updatedAt: now };
    const newData: BoardData = {
      objects: srcData.objects.map(o => ({ ...o, id: uuidv4() })),
      history: [[]],
      historyIndex: 0,
    };

    storage.boardsMeta.push(newMeta);
    storage.boardsData[newId] = newData;
    saveStorage(storage);

    set(state => ({ boardsMeta: [...state.boardsMeta, newMeta] }));
  },

  selectBoard: (id) => {
    const storage = loadStorage();
    const data = storage.boardsData[id] || { objects: [], history: [[]], historyIndex: 0 };
    storage.currentBoardId = id;
    saveStorage(storage);
    set({ currentBoardId: id, currentBoardData: data });
  },

  goToBoardManager: () => {
    set({ currentBoardId: null, currentBoardData: null });
  },

  addObject: (objData) => {
    const { currentBoardData, currentBoardId } = get();
    if (!currentBoardData || !currentBoardId) return;

    const obj: BoardObject = { id: uuidv4(), ...objData };
    const newObjects = [...currentBoardData.objects, obj];
    const newHistory = currentBoardData.history.slice(0, currentBoardData.historyIndex + 1);
    newHistory.push(newObjects);
    if (newHistory.length > MAX_HISTORY + 1) newHistory.shift();

    const newData: BoardData = {
      objects: newObjects,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };

    const storage = loadStorage();
    storage.boardsData[currentBoardId] = newData;
    const meta = storage.boardsMeta.find(b => b.id === currentBoardId);
    if (meta) meta.updatedAt = Date.now();
    debounceSave(storage);

    set(state => ({
      currentBoardData: newData,
      boardsMeta: state.boardsMeta.map(b => b.id === currentBoardId ? { ...b, updatedAt: Date.now() } : b),
    }));
  },

  updateObject: (id, changes) => {
    const { currentBoardData, currentBoardId } = get();
    if (!currentBoardData || !currentBoardId) return;

    const newObjects = currentBoardData.objects.map(o => o.id === id ? { ...o, ...changes } : o);
    const newHistory = currentBoardData.history.slice(0, currentBoardData.historyIndex + 1);
    newHistory.push(newObjects);
    if (newHistory.length > MAX_HISTORY + 1) newHistory.shift();

    const newData: BoardData = {
      objects: newObjects,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };

    const storage = loadStorage();
    storage.boardsData[currentBoardId] = newData;
    const meta = storage.boardsMeta.find(b => b.id === currentBoardId);
    if (meta) meta.updatedAt = Date.now();
    debounceSave(storage);

    set(state => ({
      currentBoardData: newData,
      boardsMeta: state.boardsMeta.map(b => b.id === currentBoardId ? { ...b, updatedAt: Date.now() } : b),
    }));
  },

  deleteObject: (id) => {
    const { currentBoardData, currentBoardId } = get();
    if (!currentBoardData || !currentBoardId) return;

    const newObjects = currentBoardData.objects.filter(o => o.id !== id);
    const newHistory = currentBoardData.history.slice(0, currentBoardData.historyIndex + 1);
    newHistory.push(newObjects);
    if (newHistory.length > MAX_HISTORY + 1) newHistory.shift();

    const newData: BoardData = {
      objects: newObjects,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };

    const storage = loadStorage();
    storage.boardsData[currentBoardId] = newData;
    debounceSave(storage);

    set({ currentBoardData: newData });
  },

  duplicateObject: (id) => {
    const { currentBoardData, currentBoardId } = get();
    if (!currentBoardData || !currentBoardId) return;

    const original = currentBoardData.objects.find(o => o.id === id);
    if (!original) return;

    const newObj: BoardObject = { ...original, id: uuidv4(), x: original.x + 20, y: original.y + 20 };
    const newObjects = [...currentBoardData.objects, newObj];
    const newHistory = currentBoardData.history.slice(0, currentBoardData.historyIndex + 1);
    newHistory.push(newObjects);
    if (newHistory.length > MAX_HISTORY + 1) newHistory.shift();

    const newData: BoardData = {
      objects: newObjects,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };

    const storage = loadStorage();
    storage.boardsData[currentBoardId] = newData;
    debounceSave(storage);

    set({ currentBoardData: newData });
  },

  clearBoard: () => {
    const { currentBoardId } = get();
    if (!currentBoardId) return;

    const newData: BoardData = { objects: [], history: [[]], historyIndex: 0 };

    const storage = loadStorage();
    storage.boardsData[currentBoardId] = newData;
    debounceSave(storage);

    set({ currentBoardData: newData });
  },

  undo: () => {
    const { currentBoardData, currentBoardId } = get();
    if (!currentBoardData || !currentBoardId) return;
    if (currentBoardData.historyIndex <= 0) return;

    const newIndex = currentBoardData.historyIndex - 1;
    const newObjects = currentBoardData.history[newIndex];
    const newData: BoardData = { ...currentBoardData, objects: newObjects, historyIndex: newIndex };

    const storage = loadStorage();
    storage.boardsData[currentBoardId] = newData;
    debounceSave(storage);

    set({ currentBoardData: newData });
  },

  redo: () => {
    const { currentBoardData, currentBoardId } = get();
    if (!currentBoardData || !currentBoardId) return;
    if (currentBoardData.historyIndex >= currentBoardData.history.length - 1) return;

    const newIndex = currentBoardData.historyIndex + 1;
    const newObjects = currentBoardData.history[newIndex];
    const newData: BoardData = { ...currentBoardData, objects: newObjects, historyIndex: newIndex };

    const storage = loadStorage();
    storage.boardsData[currentBoardId] = newData;
    debounceSave(storage);

    set({ currentBoardData: newData });
  },

  importObjects: (objects) => {
    const { currentBoardId } = get();
    if (!currentBoardId) return;

    const withNewIds = objects.map(o => ({ ...o, id: uuidv4() }));
    const newData: BoardData = { objects: withNewIds, history: [[], withNewIds], historyIndex: 1 };

    const storage = loadStorage();
    storage.boardsData[currentBoardId] = newData;
    debounceSave(storage);

    set({ currentBoardData: newData });
  },
}));
