import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import axios from "axios";

const API_URL = "http://localhost:3001/notes";

const NotesContext = createContext(null);

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API_URL);
      setNotes(response.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to load notes. Check JSON Server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function createNote(note) {
    setLoading(true);
    setError("");

    try {
      const now = new Date().toISOString();

      const response = await axios.post(API_URL, {
        ...note,
        createdAt: now,
        updatedAt: now,
      });

      setNotes((previous) => [response.data, ...previous]);
    } catch (err) {
      console.error("Create error:", err);
      setError("Unable to save note. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function updateNote(id, updates) {
    setLoading(true);
    setError("");

    try {
      const response = await axios.patch(`${API_URL}/${id}`, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      setNotes((previous) =>
        previous.map((note) =>
          String(note.id) === String(id) ? response.data : note
        )
      );
    } catch (err) {
      console.error("Update error:", err);
      setError("Unable to update note.");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(id) {
    setLoading(true);
    setError("");

    try {
      await axios.delete(`${API_URL}/${id}`);

      setNotes((previous) =>
        previous.filter(
          (note) => String(note.id) !== String(id)
        )
      );
    } catch (err) {
      console.error("Delete error:", err);
      setError("Unable to delete note.");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function toggleArchive(id) {
    const note = notes.find(
      (item) => String(item.id) === String(id)
    );

    if (!note) {
      throw new Error("Note not found.");
    }

    await updateNote(id, {
      archived: !note.archived,
    });
  }

  function searchNotes(query) {
    const searchTerm = query.trim().toLowerCase();

    if (!searchTerm) return notes;

    return notes.filter((note) => {
      const tags = (note.tags || []).join(" ");
      const text = `${note.title} ${note.content} ${tags}`;

      return text.toLowerCase().includes(searchTerm);
    });
  }

  return (
    <NotesContext.Provider
      value={{
        notes,
        loading,
        error,
        createNote,
        updateNote,
        deleteNote,
        toggleArchive,
        searchNotes,
        fetchNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);

  if (!context) {
    throw new Error(
      "useNotes must be used inside NotesProvider."
    );
  }

  return context;
}