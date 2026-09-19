import { z } from "zod";

/** Why a change is being made. Required for every audited admin action. */
export const reasonField = z.string().trim().min(3, "Please give a reason (at least 3 characters)").max(500);
