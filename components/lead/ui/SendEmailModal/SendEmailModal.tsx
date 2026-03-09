"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import iconClose from "../../assets/close.svg";
import m from "@/components/Modal/Modal.module.scss";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  toEmail: string;
}

function encodeMailtoParam(value: string): string {
  return encodeURIComponent(value.replace(/\r\n/g, "\n"));
}

export function SendEmailModal({ isOpen, onClose, toEmail }: SendEmailModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleOpenInMail = useCallback(() => {
    const mailto = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeMailtoParam(subject)}&body=${encodeMailtoParam(body)}`;
    window.open(mailto, "_blank", "noopener,noreferrer");
  }, [toEmail, subject, body]);

  const handleClose = useCallback(() => {
    setSubject("");
    setBody("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={m.Modal} role="dialog" aria-modal="true" aria-labelledby="send-email-title">
      <div className={m.Modal__backdrop} onClick={handleClose} aria-hidden />
      <div className={m.Modal__content} onClick={(e) => e.stopPropagation()}>
        <div className={m.Modal__header}>
          <h3 id="send-email-title" className={m.Modal__title}>Send email</h3>
          <button
            type="button"
            className={m.Modal__closeBtn}
            onClick={handleClose}
            aria-label="Close"
          >
            <Image src={iconClose} width={24} height={24} alt="" />
          </button>
        </div>

        <div className={m.Modal__body}>
          <div className={m.Modal__field}>
            <label htmlFor="send-email-to">To</label>
            <input
              id="send-email-to"
              type="email"
              value={toEmail}
              readOnly
              aria-readonly="true"
            />
          </div>
          <div className={m.Modal__field}>
            <label htmlFor="send-email-subject">Subject</label>
            <input
              id="send-email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>
          <div className={m.Modal__field}>
            <label htmlFor="send-email-body">Message</label>
            <textarea
              id="send-email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your message..."
            />
          </div>
        </div>

        <div className={m.Modal__actions}>
          <button type="button" className={m.Modal__cancel} onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className={m.Modal__submit}
            onClick={handleOpenInMail}
          >
            Open in mail
          </button>
        </div>
      </div>
    </div>
  );
}
