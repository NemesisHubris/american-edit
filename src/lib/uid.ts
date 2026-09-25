import { useId } from "react";

// SVG ids must be unique across the whole page (several shots can be on
// screen at once during transitions), so derive them from React's useId.
export const useUid = (prefix: string) => prefix + useId().replace(/[^a-zA-Z0-9_-]/g, "");
