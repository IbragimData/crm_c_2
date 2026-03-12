import iconPencil from "../assets/pencil.svg";
import iconNote from "../assets/note.svg";
import iconCreate from "../assets/create.svg";
import { LeadHistoryAction } from "@/features";

interface HistoryVisual {
    icon: string;        // путь к иконке
    blockColor: string;  // цвет блока слева
}

export function getHistoryVisual(action: LeadHistoryAction): HistoryVisual {
    switch (action) {
        case "TEAM_ASSIGNED":
        case "TEAM_REMOVED":
        case "STATUS_CHANGED":
            return { icon: iconPencil, blockColor: "#3f8cff" };
        case "NOTE_ADDED":
        case "NOTE_UPDATED":
            return { icon: iconNote, blockColor: "#28a745" };
        case "REMINDER_CREATED":
        case "REMINDER_COMPLETED":
            return { icon: iconNote, blockColor: "#ff7b00" };
        case "OWNER_CHANGED":
            return { icon: iconPencil, blockColor: "#6f42c1" };
        case "CREATED":
        case "SYSTEM":
            return { icon: iconCreate, blockColor: "#6c757d" };
        default:
            return { icon: iconPencil, blockColor: "#979797" };
    }
}