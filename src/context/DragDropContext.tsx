"use client";

import React, { createContext, useContext, ReactNode, useRef } from "react";
import { DragDropContext as DndContext, DropResult } from "@hello-pangea/dnd";

interface DragDropContextType {
  onDragEnd: React.MutableRefObject<(result: DropResult) => void>;
}

const DragDropContext = createContext<DragDropContextType>({
  onDragEnd: { current: () => {} },
});

export const useDragDrop = () => useContext(DragDropContext);

export const DragDropProvider: React.FC<{
  children: ReactNode;
  onDragEnd: (result: DropResult) => void;
}> = ({ children, onDragEnd }) => {
  const onDragEndRef = useRef(onDragEnd);

  return (
    <DragDropContext.Provider value={{ onDragEnd: onDragEndRef }}>
      <DndContext onDragEnd={onDragEndRef.current}>{children}</DndContext>
    </DragDropContext.Provider>
  );
};
