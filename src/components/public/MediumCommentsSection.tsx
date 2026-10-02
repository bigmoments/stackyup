"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send, CheckCircle2, Heart, AlertCircle, CornerDownRight } from "lucide-react";

export interface CommentData {
  id: string;
  postId?: string;
  authorName: string;
  authorEmail?: string | null;
  content: string;
  status?: string;
  createdAt: string | Date;
}

interface MediumCommentsSectionProps {
  postId: string;
  initialComments?: CommentData[];
}

export default function MediumCommentsSection({
  postId,
  initialComments = [],
}: MediumCommentsSectionProps) {
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});

  // Restore liked comments and author profile from localStorage
  useEffect(() => {
    try {
      const storedLikes = localStorage.getItem("sy_liked_comments");
      if (storedLikes) {
        setLikedComments(JSON.parse(storedLikes));
      }
      const savedAuthor = localStorage.getItem("sy_comment_author_name");
      if (savedAuthor) setAuthorName(savedAuthor);
      const savedEmail = localStorage.getItem("sy_comment_author_email");
      if (savedEmail) setAuthorEmail(savedEmail);
    } catch {}
  }, []);

  function toggleLike(commentId: string) {
    setLikedComments((prev) => {
      const updated = { ...prev, [commentId]: !prev[commentId] };
      try {
        localStorage.setItem("sy_liked_comments", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg(false);

    const trimmedAuthor = authorName.trim() || "Reader";
    const trimmedEmail = authorEmail.trim();

    try {
      const res = await fetch(`/api/v1/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: trimmedAuthor,
          authorEmail: trimmedEmail || undefined,
          content: commentText.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to post comment.");
      }

      // Save user details for convenience
      try {
        localStorage.setItem("sy_comment_author_name", trimmedAuthor);
        if (trimmedEmail) localStorage.setItem("sy_comment_author_email", trimmedEmail);
      } catch {}

      const createdComment: CommentData = json.data || {
        id: `cmt_${Date.now()}`,
        authorName: trimmedAuthor,
        content: commentText.trim(),
        createdAt: new Date().toISOString(),
      };

      setComments((prev) => [createdComment, ...prev]);
      setCommentText("");
      setIsFocused(false);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error posting comment.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Ctrl+Enter or Cmd+Enter to submit
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <section className="mt-16 pt-10 border-t border-[#e8ece9] w-full space-y-8 font-sans">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-bold text-2xl text-[#101313] flex items-center gap-2.5">
          <MessageCircle className="w-5 h-5 text-[#079653]" />
          <span>Responses</span>
          <span className="text-sm font-semibold bg-[#eaf8f0] text-[#079653] px-2.5 py-0.5 rounded-full">
            {comments.length}
          </span>
        </h3>
        <span className="text-xs text-[#667085]">
          Constructive, high-signal tech discussions only
        </span>
      </div>

      {/* Input Form Card */}
      <form
        onSubmit={handleSubmit}
        className="p-5 rounded-2xl border border-[#e8ece9] bg-[#f8faf9] shadow-2xs space-y-3.5 transition-all"
      >
        {/* User Identity Fields */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#101313] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {authorName ? authorName.charAt(0).toUpperCase() : "R"}
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <input
              type="text"
              placeholder="Your name (e.g. Sarah Lin, AI Engineer)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="text-xs bg-white border border-[#e8ece9] focus:border-[#079653] rounded-lg px-3 py-1.5 focus:outline-none text-[#101313] placeholder:text-[#8a9099] w-full sm:w-56 transition"
            />
            <input
              type="email"
              placeholder="Email (optional, not published)"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              className="text-xs bg-white border border-[#e8ece9] focus:border-[#079653] rounded-lg px-3 py-1.5 focus:outline-none text-[#101313] placeholder:text-[#8a9099] w-full sm:w-56 transition"
            />
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            rows={isFocused || commentText ? 4 : 2}
            placeholder="Share your perspective, benchmark experience, or questions..."
            value={commentText}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={2000}
            className="w-full bg-white border border-[#e8ece9] focus:border-[#079653] rounded-xl p-3.5 text-sm text-[#101313] placeholder:text-[#8a9099] focus:outline-none resize-none transition leading-relaxed"
          />
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-[#eaf8f0] border border-[#a4e2bf] rounded-xl text-xs text-[#079653] font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Thank you! Your response has been posted and is live.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Controls when focused or text entered */}
        {(isFocused || commentText) && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-[#8a9099]">
              {commentText.length}/2000 • <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#e8ece9]">Ctrl</kbd> + <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#e8ece9]">Enter</kbd> to submit
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFocused(false);
                  setCommentText("");
                  setErrorMsg("");
                }}
                className="px-4 py-2 text-xs text-[#667085] hover:text-[#101313] transition font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#079653] hover:bg-[#067a43] disabled:opacity-40 text-white text-xs font-semibold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <span>{isSubmitting ? "Posting..." : "Respond"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Responses List */}
      <div className="divide-y divide-[#e8ece9] pt-2">
        {comments.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-[#f8faf9] border border-dashed border-[#e8ece9]">
            <MessageCircle className="w-8 h-8 text-[#8a9099] mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-semibold text-[#101313]">No responses yet</h4>
            <p className="text-xs text-[#667085] mt-1 max-w-xs mx-auto">
              Be the first to share your thoughts, empirical findings, or questions on this story.
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isLiked = Boolean(likedComments[comment.id]);
            const dateStr = comment.createdAt
              ? new Date(comment.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Just now";

            return (
              <article key={comment.id} className="py-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#eaf8f0] text-[#079653] font-bold flex items-center justify-center text-xs shrink-0 border border-[#c1ebd4]">
                      {(comment.authorName || "R").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#101313] leading-tight">
                        {comment.authorName || "Reader"}
                      </h4>
                      <p className="text-[11px] text-[#8a9099] mt-0.5">{dateStr}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleLike(comment.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                      isLiked
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : "bg-white text-[#667085] border-[#e8ece9] hover:text-[#101313] hover:bg-[#f8faf9]"
                    }`}
                    title={isLiked ? "Unlike" : "Helpful response"}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-600" : ""}`} />
                    <span className="text-[11px]">{isLiked ? "1" : "0"}</span>
                  </button>
                </div>

                <p className="text-sm sm:text-[15px] leading-relaxed text-[#242424] whitespace-pre-wrap pl-11">
                  {comment.content}
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
