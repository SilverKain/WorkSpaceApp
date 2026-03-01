import React from 'react';
import { useAppStore } from '../store/useAppStore';
import BoardCard from './BoardCard';

const BoardManager: React.FC = () => {
  const { boardsMeta, createBoard, deleteBoard, renameBoard, selectBoard } = useAppStore();

  // Load object counts from localStorage
  const getObjectCount = (boardId: string): number => {
    try {
      const raw = localStorage.getItem('ai-board-app');
      if (raw) {
        const storage = JSON.parse(raw);
        return storage.boardsData?.[boardId]?.objects?.length ?? 0;
      }
    } catch {}
    return 0;
  };

  const handleDelete = (id: string) => {
    if (boardsMeta.length <= 1) {
      alert('Необходимо наличие хотя бы одной доски.');
      return;
    }
    if (confirm('Удалить эту доску? Действие нельзя отменить.')) {
      deleteBoard(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 sm:px-8 py-4 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            B
          </div>
          <h1 className="text-xl font-bold text-white">Доски</h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 sm:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-300">
            Мои доски
            <span className="ml-2 text-sm font-normal text-slate-500">({boardsMeta.length})</span>
          </h2>
        </div>

        {boardsMeta.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg">Досок пока нет</p>
            <p className="text-sm mt-1">Нажмите «+» ниже чтобы начать</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {boardsMeta.map(board => (
              <BoardCard
                key={board.id}
                board={board}
                objectCount={getObjectCount(board.id)}
                onSelect={selectBoard}
                onDelete={handleDelete}
                onRename={renameBoard}
              />
            ))}
            {/* Add new board card */}
            <button
              onClick={createBoard}
              className="bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl h-48 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <span className="text-3xl mb-2">+</span>
              <span className="text-sm font-medium">Новая доска</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default BoardManager;
