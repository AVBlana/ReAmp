"use client";

import { useRef } from "react";
import { DropResult } from "@hello-pangea/dnd";
import { DragDropProvider } from "../../context/DragDropContext";

export default function DragDropWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const onDragEndRef = useRef((result: DropResult) => {
    // This is a placeholder function that will be overridden by the actual implementation in the pages
    console.log("Drag ended:", result);
  });

  return (
    <DragDropProvider onDragEnd={onDragEndRef.current}>
      {children}
    </DragDropProvider>
  );
}
