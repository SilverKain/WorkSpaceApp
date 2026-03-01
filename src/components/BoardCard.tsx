import React, { useState } from 'react';
import type { BoardMeta } from '../types';

interface BoardCardProps {
  board: BoardMeta;
  objectCount: number;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

const BoardCard: React.FC<BoardCardProps> = ({ board, objectCount, onSelect, onDelete, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(board.name);

  const handleRename = () => {
    if (name.trim()) {
      onRename(board.id, name.trim());
    } else {
      setName(board.name);
    }
    setEditing(false);
  };

  const updatedDate = new Date(board.updatedAt).toLocaleDateString('ru-RU', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="bg-slate-800 rounded-xl shadow-md border border-slate-700 hover:border-indigo-500 transition-all hover:shadow-indigo-900/30 hover:shadow-lg flex flex-col overflow-hidden group">
      {/* Board preview area */}
      <div
        className="h-32 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 flex items-center justify-center cursor-pointer"
        onClick={() => onSelect(board.id)}
      >
        <div className="text-4xl opacity-40">📋</div>
      </div>

      {/* Board info */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        {editing ? (
          <input
            autoFocus
            className="text-sm font-semibold text-white bg-slate-700 border border-indigo-500 rounded px-1 w-full focus:outline-none"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setName(board.name); setEditing(false); }
            }}
          />
        ) : (
          <h3
            className="text-sm font-semibold text-slate-100 truncate cursor-pointer hover:text-indigo-400 transition-colors"
            onDoubleClick={() => setEditing(true)}
            title={board.name}
          >
            {board.name}
          </h3>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{objectCount} объектов</span>
          <span>{updatedDate}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex items-center gap-1.5">
        <button
          onClick={() => onSelect(board.id)}
          className="flex-1 bg-gray-900 text-white text-sm font-semibold py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
        >
          Открыть
        </button>
        <button
          onClick={() => setEditing(true)}
          title="Переименовать"
          className="px-2.5 py-2 text-xs font-semibold bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white rounded-lg transition-colors"
        >
          Имя
        </button>
        <button
          onClick={() => onDelete(board.id)}
          title="Удалить"
          className="px-2.5 py-2 text-xs font-semibold bg-red-900/60 text-red-300 hover:bg-red-700 hover:text-white rounded-lg transition-colors"
        >
          Удалить
        </button>
      </div>
    </div>
  );
};

export default BoardCard;
