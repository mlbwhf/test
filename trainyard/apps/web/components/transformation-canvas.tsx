"use client";

// The transformation canvas as a board of its own (template "transformation-canvas"): the same
// canvas the Advanced SPC class fills part by part, here whole, for a team's own transformation.

import { TRANSFORMATION_CANVAS_EXAMPLE, TRANSFORMATION_CANVAS_QUESTIONS, type Board } from "@trainyard/core";
import { useFrameState } from "@/components/exercise-boards";
import { AsCanvasBoard } from "@/components/popm-boards";

const CONFIG = { focus: "all", questions: TRANSFORMATION_CANVAS_QUESTIONS, example: TRANSFORMATION_CANVAS_EXAMPLE, prompt: "Align your transformation objective with the business objective it serves: fill in the context, both objectives and their key results, then connect each leading indicator to the business results it leads to." };

export function TransformationCanvasBoard({ board, readOnly, onChanged, onError }: { board: Board; readOnly: boolean; onChanged: () => void; onError: (m: string) => void }) {
  const frame = board.frames[0]!;
  const [st, op] = useFrameState(board, frame, onChanged, onError);
  return <AsCanvasBoard board={board} frame={frame} config={CONFIG} st={st} op={op} readOnly={readOnly} trainer={false} />;
}
