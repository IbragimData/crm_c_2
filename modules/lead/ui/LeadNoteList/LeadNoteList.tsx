'use client';

import { AutoTextarea, NoteItem } from "@/components";
import s from "./LeadNoteList.module.scss";
import { useEffect, useRef, useState } from "react";
import { LeadNote } from "@/features/note/types";
import { useLeadNotes } from "@/features";

interface LeadNoteListProps {
  leadId: string;
}

export function LeadNoteList({ leadId }: LeadNoteListProps) {
  const [text, setText] = useState<string>("");
  const [selectedNote, setSelectedNote] = useState<LeadNote | null>(null);

  const { notes, loading, loadMore, hasMore, addNote } = useLeadNotes(leadId);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, loadMore]);

  useEffect(() => {
    if (notes.length > 0 && !selectedNote) {
      const latest = [...notes].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )[0];
      setSelectedNote(latest);
    }
  }, [notes]);

  const handleSaveNote = async () => {
    if (!text.trim()) return;
    try {
      const created = await addNote(text);
      setSelectedNote(created);
      setText("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={s.LeadNoteList}>
      <div className={s.LeadNoteList__scrollWrap}>
        <div className={s.LeadNoteList__scroll}>
          <h2 className={s.LeadNoteList__title}>Notes</h2>

          <div className={s.LeadNoteList__form}>
            <span className={s.LeadNoteList__formLabel}>New note</span>
            <div className={s.LeadNoteList__formField}>
              <AutoTextarea
                placeholder="Write a note..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <button
              type="button"
              className={s.LeadNoteList__saveBtn}
              onClick={handleSaveNote}
              disabled={!text.trim()}
            >
              Save note
            </button>
          </div>

          <div className={s.LeadNoteList__list}>
            {loading && notes.length === 0 ? (
              <p className={s.LeadNoteList__loading}>Loading notes...</p>
            ) : (
              <>
                {notes.length > 0 && (
                  <span className={s.LeadNoteList__listTitle}>Recent notes</span>
                )}
                {notes.map((note) => (
                  <NoteItem key={note.id} note={note} />
                ))}
              </>
            )}
            <div ref={observerTarget} className={s.LeadNoteList__sentinel} />
          </div>
        </div>
      </div>
    </div>
  );
}
