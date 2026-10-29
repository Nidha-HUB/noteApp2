import { useMemo, useState } from "react";
import { useNotes } from "./NotesContext.jsx";
import "./App.css";

const COLORS = [
  "#ffffff",
  "#fef3c7",
  "#dcfce7",
  "#dbeafe",
  "#fce7f3",
  "#ede9fe",
];

function App() {
  const {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    toggleArchive,
    searchNotes,
  } = useNotes();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [tagsInput, setTagsInput] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [pinnedIds, setPinnedIds] = useState([]);

  function showToast(message) {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2500);
  }

  function resetForm() {
    setTitle("");
    setContent("");
    setColor("#ffffff");
    setTagsInput("");
    setEditingId(null);
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanContent) {
      setFormError("Please enter note content.");
      return;
    }

    if (cleanTitle.length > 100) {
      setFormError("Title cannot exceed 100 characters.");
      return;
    }

    if (cleanContent.length > 5000) {
      setFormError("Content cannot exceed 5000 characters.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const duplicate = notes.some(
      (note) =>
        String(note.id) !== String(editingId) &&
        note.title.toLowerCase() === cleanTitle.toLowerCase() &&
        note.content.toLowerCase() === cleanContent.toLowerCase()
    );

    if (duplicate) {
      setFormError("This note already exists.");
      return;
    }

    setFormError("");

    try {
      if (editingId !== null) {
        await updateNote(editingId, {
          title: cleanTitle,
          content: cleanContent,
          color,
          tags,
        });

        showToast("Note updated successfully!");
      } else {
        await createNote({
          title: cleanTitle,
          content: cleanContent,
          color,
          tags,
          archived: false,
          stock: 0,
        });

        showToast("Note created successfully!");
      }

      resetForm();
    } catch (err) {
      console.error("Save note error:", err);
      setFormError(
        err.message || "Unable to save note. Please try again."
      );
    }
  }

  function editNote(note) {
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setTagsInput((note.tags || []).join(", "));
    setEditingId(String(note.id));
    setShowArchive(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteNote(id);

      setPinnedIds((previous) =>
        previous.filter(
          (pinnedId) => pinnedId !== String(id)
        )
      );

      showToast("Note deleted successfully!");
    } catch (err) {
      console.error("Delete note error:", err);
      showToast("Failed to delete note.");
    }
  }

  async function handleArchive(note) {
    try {
      await toggleArchive(note.id);

      showToast(
        note.archived
          ? "Note unarchived successfully!"
          : "Note archived successfully!"
      );
    } catch (err) {
      console.error("Archive note error:", err);
      showToast("Failed to update archive status.");
    }
  }

  function togglePin(id) {
    const stringId = String(id);

    setPinnedIds((previous) =>
      previous.includes(stringId)
        ? previous.filter((item) => item !== stringId)
        : [...previous, stringId]
    );
  }

  const visibleNotes = useMemo(() => {
    return searchNotes(search)
      .filter((note) => note.archived === showArchive)
      .sort(
        (a, b) =>
          Number(pinnedIds.includes(String(b.id))) -
          Number(pinnedIds.includes(String(a.id)))
      );
  }, [notes, search, showArchive, pinnedIds]);

  return (
    <div className="app">
      <header className="header">
        <h1>📝 NoteSpace</h1>

        <input
          className="search"
          type="search"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          type="button"
          className={!showArchive ? "nav-button active" : "nav-button"}
          onClick={() => setShowArchive(false)}
        >
          My Notes
        </button>

        <button
          type="button"
          className={showArchive ? "nav-button active" : "nav-button"}
          onClick={() => setShowArchive(true)}
        >
          Archive
        </button>
      </header>

      <main className="container">
        {!showArchive && (
          <form
            className="note-form"
            onSubmit={handleSubmit}
            style={{ backgroundColor: color }}
          >
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Write your note..."
              value={content}
              maxLength={5000}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />

            <input
              type="text"
              placeholder="Tags (comma separated, e.g. study, work)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />

            <div className="color-picker">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  title={item}
                  aria-label={`Select ${item} color`}
                  onClick={() => setColor(item)}
                  className={
                    color === item ? "color selected" : "color"
                  }
                  style={{ backgroundColor: item }}
                />
              ))}
            </div>

            {formError && (
              <p className="error">{formError}</p>
            )}

            <div className="form-actions">
              {editingId !== null && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="save-button"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Note"
                    : "Add Note"}
              </button>
            </div>
          </form>
        )}

        <div className="section-heading">
          <h2>{showArchive ? "Archived Notes" : "Your Notes"}</h2>
          <span>{visibleNotes.length} notes</span>
        </div>

        {error && <p className="error">{error}</p>}

        {loading && notes.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notes...</p>
          </div>
        ) : visibleNotes.length === 0 ? (
          <div className="empty-state">
            <span>📒</span>

            <h3>
              {search ? "No notes found" : "No notes yet"}
            </h3>

            <p>
              {search
                ? "Try searching with another word."
                : "Create your first note above."}
            </p>
          </div>
        ) : (
          <div className="notes-grid">
            {visibleNotes.map((note) => (
              <article
                className="note-card"
                key={note.id}
                style={{ backgroundColor: note.color }}
              >
                <div className="note-top">
                  <h3>{note.title || "Untitled"}</h3>

                  <button
                    type="button"
                    className="icon-button"
                    title={
                      pinnedIds.includes(String(note.id))
                        ? "Unpin note"
                        : "Pin note"
                    }
                    onClick={() => togglePin(note.id)}
                  >
                    {pinnedIds.includes(String(note.id))
                      ? "📌"
                      : "📍"}
                  </button>
                </div>

                <p className="note-content">{note.content}</p>

                {note.tags?.length > 0 && (
                  <div className="tags">
                    {note.tags.map((tag) => (
                      <span key={tag} className="tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="note-date">
                  Created:{" "}
                  {new Date(note.createdAt).toLocaleString()}
                  <br />
                  Updated:{" "}
                  {new Date(note.updatedAt).toLocaleString()}
                </div>

                <div className="note-actions">
                  {!note.archived && (
                    <button
                      type="button"
                      onClick={() => editNote(note)}
                    >
                      Edit
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleArchive(note)}
                  >
                    {note.archived ? "Unarchive" : "Archive"}
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDelete(note.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;