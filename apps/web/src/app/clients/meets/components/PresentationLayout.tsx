"use client";

import { Ghost, Hand } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import type { Participant } from "../types";
import { getSpeakerHighlightClasses, isSystemUserId } from "../utils";
import ParticipantVideo from "./ParticipantVideo";

interface PresentationLayoutProps {
  presentationStream: MediaStream;
  presenterName: string;
  localStream: MediaStream | null;
  isCameraOff: boolean;
  isHandRaised: boolean;
  isGhost: boolean;
  participants: Map<string, Participant>;
  userEmail: string;
  isMirrorCamera: boolean;
  activeSpeakerId: string | null;
  currentUserId: string;
  audioOutputDeviceId?: string;
  getDisplayName: (userId: string) => string;
}

function PresentationLayout({
  presentationStream,
  presenterName,
  localStream,
  isCameraOff,
  isHandRaised,
  isGhost,
  participants,
  userEmail,
  isMirrorCamera,
  activeSpeakerId,
  currentUserId,
  audioOutputDeviceId,
  getDisplayName,
}: PresentationLayoutProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const presentationVideoRef = useRef<HTMLVideoElement>(null);
  const isLocalActiveSpeaker = activeSpeakerId === currentUserId;

  useEffect(() => {
    const video = localVideoRef.current;
    if (video && localStream) {
      video.srcObject = localStream;
      video.play().catch((err) => {
        if (err.name !== "AbortError") {
          console.error("[Meets] Presentation local video play error:", err);
        }
      });
    }
  }, [localStream]);

  useEffect(() => {
    const video = presentationVideoRef.current;
    if (video && presentationStream) {
      if (video.srcObject !== presentationStream) {
        video.srcObject = presentationStream;
        video.play().catch((err) => {
          if (err.name !== "AbortError") {
            console.error("[Meets] Presentation video play error:", err);
          }
        });
      }
    }
  }, [presentationStream]);

  return (
    <div className="flex flex-1 gap-4 overflow-hidden">
      <div className="flex-1 bg-[#1a1a1a] border border-[#FEFCD9]/10 rounded-xl overflow-hidden relative flex items-center justify-center">
        <video
          ref={presentationVideoRef}
          autoPlay
          playsInline
          className="max-w-full max-h-full"
        />
        <div
          className="absolute top-3 left-3 bg-[#0d0e0d]/80 backdrop-blur-sm border border-[#FEFCD9]/10 rounded-full px-3 py-1.5 flex items-center gap-2"
          style={{ fontFamily: "'PolySans Mono', monospace" }}
        >
          <span className="text-[10px] uppercase tracking-[0.12em] text-[#FEFCD9]/60">Presenting</span>
          <span className="text-xs text-[#FEFCD9] font-medium">{presenterName}</span>
        </div>
      </div>

      <div className="w-64 flex flex-col gap-3 overflow-y-auto overflow-x-visible px-1">
        <div
          className={`relative bg-[#1a1a1a] border border-[#FEFCD9]/10 rounded-xl overflow-hidden h-36 shrink-0 transition-all duration-200 ${getSpeakerHighlightClasses(
            isLocalActiveSpeaker
          )}`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${isCameraOff ? "hidden" : ""
              } ${isMirrorCamera ? "scale-x-[-1]" : ""}`}
          />
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0d0e0d]">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F95F4A]/20 to-[#FF007A]/20 border border-[#FEFCD9]/20 flex items-center justify-center text-lg text-[#FEFCD9] font-bold">
                {userEmail[0]?.toUpperCase() || "?"}
              </div>
            </div>
          )}
          {isGhost && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-1.5">
                <Ghost className="w-12 h-12 text-[#FF007A] drop-shadow-[0_0_18px_rgba(255,0,122,0.45)]" />
                <span
                  className="text-[10px] text-[#FF007A]/90 bg-black/60 border border-[#FF007A]/30 px-2 py-0.5 rounded-full uppercase tracking-[0.12em]"
                  style={{ fontFamily: "'PolySans Mono', monospace" }}
                >
                  Ghost
                </span>
              </div>
            </div>
          )}
          {isHandRaised && (
            <div
              className="absolute top-3 left-3 p-1.5 rounded-full bg-[#F95F4A]/20 border border-[#F95F4A]/40 text-[#F95F4A] shadow-[0_0_15px_rgba(249,95,74,0.3)]"
              title="Hand raised"
            >
              <Hand className="w-3 h-3" />
            </div>
          )}
          <div
            className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm border border-[#FEFCD9]/10 rounded-full px-3 py-1.5 flex items-center gap-2 text-[10px]"
            style={{ fontFamily: "'PolySans Mono', monospace" }}
          >
            <span className="font-medium text-[#FEFCD9] uppercase tracking-wide">You</span>
          </div>
        </div>

        {Array.from(participants.values())
          .filter((participant) => !isSystemUserId(participant.userId))
          .map((participant) => (
            <ParticipantVideo
              key={participant.userId}
              participant={participant}
              displayName={getDisplayName(participant.userId)}
              isActiveSpeaker={activeSpeakerId === participant.userId}
              compact
              audioOutputDeviceId={audioOutputDeviceId}
            />
          ))}
      </div>
    </div>
  );
}

export default memo(PresentationLayout);
