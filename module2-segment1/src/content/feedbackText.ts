/**
 * Feedback sentences built from the script's templates (Stage 1.6 games).
 * Shared by the stages and the voice generator so the spoken audio always
 * matches the words on screen.
 */
import { COLOUR_KEY, COLOUR_KEY_LINES, COLOUR_NAMES, S1_6, type ColourGroup } from "./segment1";

export const COLOURS: ColourGroup[] = ["red", "yellow", "blue", "green"];

export const colourLine = (c: ColourGroup) => COLOUR_KEY_LINES.find((l) => l.colour === c)!.line;
export const colourRight = (c: ColourGroup) => S1_6.right(COLOUR_NAMES[c].toLowerCase(), COLOUR_KEY[c]);
export const colourWrong = (attempted: ColourGroup) => S1_6.wrong(COLOUR_NAMES[attempted].toLowerCase());

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
