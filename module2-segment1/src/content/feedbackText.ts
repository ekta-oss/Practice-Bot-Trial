/**
 * Feedback sentences built from the script's templates (Stage 1.6 games).
 * Shared by the stages and the voice generator so the spoken audio always
 * matches the words on screen.
 */
import { COLOUR_KEY_LINES, S1_6, type ColourGroup } from "./segment1";

export const COLOURS: ColourGroup[] = ["red", "yellow", "blue", "green"];

export const colourLine = (c: ColourGroup) => COLOUR_KEY_LINES.find((l) => l.colour === c)!.line;

export type ShapeId = "triangle" | "circle" | "square";
export const SHAPES: ShapeId[] = ["triangle", "circle", "square"];
const SHAPE_ARTICLE: Record<ShapeId, string> = { triangle: "a triangle", circle: "a circle", square: "a square or rectangle" };
const SHAPE_KEY: Record<ShapeId, string> = {
  triangle: "Triangle = warns of a hazard",
  circle: "Circle = something you must do, or must not do",
  square: "Square or rectangle = safe way or fire safety",
};
const shapeMeaning = (s: ShapeId) => S1_6.game2.shapes.find((x) => x.id === s)!.meaning;

export const shapeRight = (s: ShapeId) => S1_6.right(SHAPE_ARTICLE[s], `‘${shapeMeaning(s)}’`);
export const shapeWrong = (s: ShapeId) => S1_6.wrong(SHAPE_ARTICLE[s]);
export const shapeKey = (s: ShapeId) => SHAPE_KEY[s];

/* New Signs (1.6): each new sign into what it means, e.g. "Right — a blue circle means you must." */
type NewSign = (typeof S1_6.game3.signs)[number];
export const newSignRight = (s: NewSign) => S1_6.right(s.subject, s.meaning);
export const newSignWrong = (s: NewSign) => S1_6.wrong(s.subject);
export const newSignHint = (s: NewSign) => colourLine(s.colour);
