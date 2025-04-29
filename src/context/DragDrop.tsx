import React, { ReactNode } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";

interface DragDropProviderProps {
  children: ReactNode;
  onDragEnd: (result: DropResult) => void;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
  onDragEnd,
}) => {
  return <DragDropContext onDragEnd={onDragEnd}>{children}</DragDropContext>;
};
