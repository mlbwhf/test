import { cache } from "react";
import { api } from "@/lib/api";

// The console layout and its pages both need the signed-in person and the Today summary.
// cache() makes each a single API call per request, however many components ask.
export const getMe = cache(() => api.me());
export const getHome = cache(() => api.home());
