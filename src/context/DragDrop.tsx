import { createContext, useContext, ReactNode } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";

interface DragDropContextProps {
  children: ReactNode;
  onDragEnd: (result: DropResult) => void;
}

const DragDropContextWrapper = ({
  children,
  onDragEnd,
}: DragDropContextProps) => {
  return <DragDropContext onDragEnd={onDragEnd}>{children}</DragDropContext>;
};

export default DragDropContextWrapper;
