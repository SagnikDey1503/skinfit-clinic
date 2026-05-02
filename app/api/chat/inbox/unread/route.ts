import { NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/src/lib/auth/get-session";
import {
  countUnreadClinicMessagesForAssistant,
  parseInboxSinceParams,
} from "@/src/lib/chatInboxUnread";
import { getUnreadVoiceNoteBreakdown } from "@/src/lib/voiceNoteInboxUnread";

const MAX_BADGE = 99;

export async function GET(req: Request) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(req.url);
  const { supportSince, doctorSince } = parseInboxSinceParams(url);

  const [supportRaw, doctorRaw, voiceBreakdown] = await Promise.all([
    countUnreadClinicMessagesForAssistant({
      userId,
      assistantId: "support",
      since: supportSince,
    }),
    countUnreadClinicMessagesForAssistant({
      userId,
      assistantId: "doctor",
      since: doctorSince,
    }),
    getUnreadVoiceNoteBreakdown(userId),
  ]);

  const supportCount = Math.min(supportRaw, MAX_BADGE);
  const doctorCount = Math.min(doctorRaw, MAX_BADGE);
  const voiceNoteCount = Math.min(voiceBreakdown.total, MAX_BADGE);
  const voiceNoteGeneralCount = Math.min(voiceBreakdown.general, MAX_BADGE);
  const voiceNoteReportCount = Math.min(voiceBreakdown.report, MAX_BADGE);
  const chatTotal = supportRaw + doctorRaw;
  const total = Math.min(chatTotal + voiceBreakdown.total, MAX_BADGE);

  return NextResponse.json({
    success: true,
    supportCount,
    doctorCount,
    voiceNoteCount,
    voiceNoteGeneralCount,
    voiceNoteReportCount,
    total,
    supportHasMore: supportRaw > MAX_BADGE,
    doctorHasMore: doctorRaw > MAX_BADGE,
    hasMore: chatTotal + voiceBreakdown.total > MAX_BADGE,
  });
}
