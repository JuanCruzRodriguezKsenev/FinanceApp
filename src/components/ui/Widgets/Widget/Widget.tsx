"use client";

import { ReactNode, useRef, useReducer } from "react";
import styles from "./Widget.module.css";
import { LIMITS } from "@/constants/globals";

interface WidgetProps {
  id: string;
  index: number;
  width: number;
  children: ReactNode;
  onResize: (id: string, newWidth: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
}

interface WidgetState {
  isResizing: boolean;
  isDragging: boolean;
  startX: number;
  startWidth: number;
}

type WidgetAction =
  | { type: "START_RESIZE"; payload: number }
  | { type: "MOVE_RESIZE"; payload: number }
  | { type: "END_RESIZE" }
  | { type: "START_DRAG" }
  | { type: "END_DRAG" };

const initialState: WidgetState = {
  isResizing: false,
  isDragging: false,
  startX: 0,
  startWidth: 1,
};

function reducer(state: WidgetState, action: WidgetAction): WidgetState {
  switch (action.type) {
    case "START_RESIZE":
      return { ...state, isResizing: true, startX: action.payload };
    case "MOVE_RESIZE":
      return { ...state, startX: action.payload };
    case "END_RESIZE":
      return { ...state, isResizing: false };
    case "START_DRAG":
      return { ...state, isDragging: true };
    case "END_DRAG":
      return { ...state, isDragging: false };
    default:
      return state;
  }
}

export default function Widget({
  id,
  index,
  width,
  children,
  onResize,
  onDragStart,
  onDragOver,
  onDragEnd,
}: WidgetProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const startWidthRef = useRef<number>(width);
  const resizeHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const resizeEndHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);

  const { minWidth, maxWidth, resizeThreshold } = LIMITS.widget;

  const handleDragStart = (e: React.DragEvent) => {
    if (state.isResizing) {
      e.preventDefault();
      return;
    }

    setTimeout(() => dispatch({ type: "START_DRAG" }), 0);
    onDragStart(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    dispatch({ type: "END_DRAG" });
    onDragEnd();
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch({ type: "START_RESIZE", payload: e.clientX });
    startWidthRef.current = width;

    resizeHandlerRef.current = (e: MouseEvent) => {
      const deltaX = e.clientX - state.startX;
      const columnsMoved = Math.round(deltaX / resizeThreshold);
      let newSize = startWidthRef.current + columnsMoved;

      newSize = Math.max(minWidth, Math.min(maxWidth, newSize));

      if (newSize !== width) {
        onResize(id, newSize);
      }
    };

    resizeEndHandlerRef.current = () => {
      dispatch({ type: "END_RESIZE" });
      document.removeEventListener("mousemove", resizeHandlerRef.current!);
      document.removeEventListener("mouseup", resizeEndHandlerRef.current!);
    };

    document.addEventListener("mousemove", resizeHandlerRef.current);
    document.addEventListener("mouseup", resizeEndHandlerRef.current);
  };

  return (
    <div
      className={`
        ${styles.card} 
        ${styles[`span${width}`]} 
        ${state.isDragging ? styles.dragging : ""} 
        ${state.isResizing ? styles.resizing : ""}
      `}
      draggable={!state.isResizing}
      onDragStart={handleDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.header}>
        <div className={styles.dragHandle} aria-label="Arrastrar widget">
          :::
        </div>
      </div>

      <div className={styles.content}>{children}</div>

      <div
        className={styles.resizeHandle}
        onMouseDown={handleResizeStart}
        title="Arrastra para cambiar tamaño"
        role="button"
        tabIndex={-1}
        aria-label="Redimensionar widget"
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM10 22H8V20H10V22ZM14 22H12V20H14V22ZM18 18H16V16H18V18Z" />
        </svg>
      </div>
    </div>
  );
}
