class NoteApp {
    constructor() {
        this.initializeElements();
        this.loadNotes();
        this.setupEventListeners();
        this.setupAnimations();
        this.setupCustomCursor();
        this.currentNoteId = null;

        // Initialize marked options
        marked.setOptions({
            breaks: true,  // Enable line breaks
            gfm: true,    // Enable GitHub Flavored Markdown
            headerIds: false, // Disable header IDs
            mangle: false, // Disable mangle
        });
    }

    initializeElements() {
        // Main views
        this.mainView = document.getElementById('mainView');
        this.notesView = document.getElementById('notesView');
        this.searchView = document.getElementById('searchView');
        this.noteDetailView = document.getElementById('noteDetailView');
        
        // Overlays
        this.searchOverlay = document.getElementById('searchOverlay');
        this.notesOverlay = document.getElementById('notesOverlay');
        this.noteDetailOverlay = document.getElementById('noteDetailOverlay');
        
        // Buttons and inputs
        this.noteEditor = document.getElementById('noteEditor');
        this.saveNoteBtn = document.getElementById('saveNoteBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.showNotesBtn = document.getElementById('showNotesBtn');
        this.searchBtn = document.getElementById('searchBtn');
        this.searchInput = document.getElementById('searchInput');
        this.editNoteBtn = document.getElementById('editNoteBtn');
        this.deleteNoteBtn = document.getElementById('deleteNoteBtn');
        this.exportDetailBtn = document.getElementById('exportDetailBtn');
        
        // Lists and containers
        this.notesList = document.getElementById('notesList');
        this.searchResults = document.getElementById('searchResults');
        this.noteContent = document.querySelector('.note-content');
        this.placeholder = document.querySelector('.typing-placeholder');
        
        // Logo
        this.logo = document.getElementById('logo');
        
        // Initialize placeholder system
        this.placeholderMessages = [
            "Start typing your thoughts...",
            "What's on your mind?",
            "Write something beautiful...",
            "Begin your story here...",
            "Capture your ideas..."
        ];
        this.currentPlaceholderIndex = 0;
        this.initializePlaceholder();
        
        // Confirmation modal
        this.confirmationModal = document.getElementById('confirmationModal');
        this.confirmDeleteBtn = this.confirmationModal.querySelector('.btn-confirm');
        this.cancelDeleteBtn = this.confirmationModal.querySelector('.btn-cancel');
        
        // Back buttons
        this.backButtons = document.querySelectorAll('.btn-back');
        
        // Add cursor element
        this.editorCursor = document.createElement('div');
        this.editorCursor.className = 'editor-cursor';
        this.noteEditor.parentNode.appendChild(this.editorCursor);
    }

    setupAnimations() {
        document.querySelectorAll('.btn').forEach((btn, index) => {
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(20px)';
            setTimeout(() => {
                btn.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            }, 100 * (index + 1));
        });
    }

    setupCustomCursor() {
        let cursorVisible = true;
        let lastCursorPosition = { x: 0, y: 0 };

        const updateCursorPosition = (event) => {
            const rect = this.noteEditor.getBoundingClientRect();
            const style = window.getComputedStyle(this.noteEditor);
            const lineHeight = parseInt(style.lineHeight);
            const fontSize = parseInt(style.fontSize);
            
            // Get cursor position from textarea
            const textBeforeCursor = this.noteEditor.value.substring(0, this.noteEditor.selectionStart);
            const lines = textBeforeCursor.split('\n');
            const currentLine = lines.length;
            const currentLineText = lines[lines.length - 1];
            
            // Create a temporary span to measure text width
            const span = document.createElement('span');
            span.style.font = style.font;
            span.style.visibility = 'hidden';
            span.style.position = 'absolute';
            span.textContent = currentLineText;
            document.body.appendChild(span);
            
            const textWidth = span.offsetWidth;
            document.body.removeChild(span);

            // Calculate cursor position
            const x = rect.left + parseInt(style.paddingLeft) + textWidth;
            const y = rect.top + parseInt(style.paddingTop) + (currentLine - 1) * lineHeight + fontSize;

            lastCursorPosition = { x, y };
            
            // Update cursor element position
            this.editorCursor.style.left = `${textWidth}px`;
            this.editorCursor.style.top = `${(currentLine - 1) * lineHeight + fontSize}px`;
        };

        // Update cursor on input and selection changes
        this.noteEditor.addEventListener('input', updateCursorPosition);
        this.noteEditor.addEventListener('click', updateCursorPosition);
        this.noteEditor.addEventListener('keyup', updateCursorPosition);
        this.noteEditor.addEventListener('select', updateCursorPosition);

        // Show cursor when editor is focused
        this.noteEditor.addEventListener('focus', () => {
            cursorVisible = true;
            this.editorCursor.style.display = 'block';
            updateCursorPosition();
        });

        // Hide cursor when editor loses focus
        this.noteEditor.addEventListener('blur', () => {
            cursorVisible = false;
            this.editorCursor.style.display = 'none';
        });
    }

    setupEventListeners() {
        // Event listeners for buttons
        this.searchBtn.addEventListener('click', () => this.showSearch());
        this.showNotesBtn.addEventListener('click', () => this.showNotes());
        this.saveNoteBtn.addEventListener('click', () => this.saveNote());
        this.exportBtn.addEventListener('click', () => this.exportNote());
        this.editNoteBtn.addEventListener('click', () => this.editCurrentNote());
        this.exportDetailBtn.addEventListener('click', () => this.exportCurrentNote());
        this.deleteNoteBtn.addEventListener('click', () => this.deleteCurrentNote());

        // Event listeners for back buttons
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', () => this.handleBack(btn));
        });

        // Event listeners for overlays
        this.searchOverlay.addEventListener('click', () => this.hideSearch());
        this.notesOverlay.addEventListener('click', () => this.hideNotes());
        this.noteDetailOverlay.addEventListener('click', () => this.hideNoteDetail());

        // Event listeners for search
        this.searchInput.addEventListener('input', () => this.searchNotes());

        // Event listeners for notes list
        this.notesList.addEventListener('click', (e) => this.handleNoteClick(e));

        // Event listeners for editor
        this.noteEditor.addEventListener('focus', () => this.handleEditorFocus());
        this.noteEditor.addEventListener('blur', () => this.handleEditorBlur());
        this.noteEditor.addEventListener('input', () => this.handleEditorInput());

        // Logo click animation
        this.logo.addEventListener('click', () => this.animateLogo());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleBack(btn) {
        const parentView = btn.closest('.side-view, .note-detail-view');
        if (parentView) {
            parentView.classList.remove('active');
            // Remove active class from corresponding overlay
            if (parentView === this.searchView) {
                this.closeSearch();
            } else if (parentView === this.notesView) {
                this.closeNotes();
            } else if (parentView === this.noteDetailView) {
                this.closeNoteDetail();
            }
        }
    }

    handleNoteClick(e) {
        const noteItem = e.target.closest('.note-item');
        if (noteItem) {
            e.stopPropagation(); // Stop event from reaching the overlay
            const noteId = parseInt(noteItem.dataset.id);
            this.showNoteDetail(noteId);
            
            // Hide search or notes view if they're open
            if (this.searchView.classList.contains('active')) {
                this.hideSearch();
            }
            if (this.notesView.classList.contains('active')) {
                this.hideNotes();
            }
        }
    }

    showNoteDetail(noteId) {
        this.currentNoteId = noteId;
        const notes = this.getNotes();
        const note = notes.find(n => n.id === noteId);
        
        if (note) {
            const noteDetailView = document.getElementById('noteDetailView');
            const noteContent = noteDetailView.querySelector('.note-content');
            
            // Render markdown content
            noteContent.innerHTML = this.renderMarkdown(note.content);
            
            // Show the view
            noteDetailView.classList.add('active');
            this.currentNoteId = noteId;
            
            // Show overlay
            document.getElementById('noteDetailOverlay').classList.add('active');
        }
    }

    closeNoteDetail() {
        this.noteDetailView.classList.remove('active');
        this.noteDetailOverlay.classList.remove('active');
        this.currentNoteId = null;
    }

    editCurrentNote() {
        if (this.currentNoteId) {
            const note = this.getNotes().find(n => n.id === this.currentNoteId);
            if (note) {
                this.noteEditor.value = note.content;
                this.noteDetailView.classList.remove('active');
                this.noteDetailOverlay.classList.remove('active');
                this.noteEditor.focus(); // Add focus to show cursor
            }
        }
    }

    deleteCurrentNote() {
        if (this.currentNoteId) {
            const notes = this.getNotes().filter(n => n.id !== this.currentNoteId);
            localStorage.setItem('notes', JSON.stringify(notes));
            this.noteDetailView.classList.remove('active');
            this.noteDetailOverlay.classList.remove('active');
            this.currentNoteId = null;
            this.loadNotes();
            this.showToast('Note deleted');
        }
    }

    saveNote() {
        const content = this.noteEditor.value.trim();
        if (!content) return;

        const notes = this.getNotes();
        const metadata = this.generateMetadata(content);
        
        if (this.currentNoteId) {
            // Update existing note
            const noteIndex = notes.findIndex(n => n.id === this.currentNoteId);
            if (noteIndex !== -1) {
                notes[noteIndex] = {
                    ...notes[noteIndex],
                    content: content,
                    ...metadata,
                    modifiedAt: new Date().toISOString()
                };
                this.showToast('Note updated');
            }
        } else {
            // Create new note
            notes.push({
                id: Date.now(),
                content: content,
                ...metadata,
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString()
            });
            this.showToast('Note saved');
        }

        localStorage.setItem('notes', JSON.stringify(notes));
        this.noteEditor.value = '';
        this.currentNoteId = null;
        this.loadNotes();
    }

    generateMetadata(content) {
        // Extract title from first line or use default
        const lines = content.split('\n');
        const title = lines[0].trim() || 'Untitled Note';
        
        // Calculate word and character counts
        const words = content.trim().split(/\s+/).length;
        const chars = content.length;
        
        // Estimate reading time (average reading speed: 200 words per minute)
        const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
        
        // Extract tags from content (words starting with #)
        const tags = content.match(/#\w+/g) || [];
        
        return {
            title,
            words,
            chars,
            readingTime: readingTimeMinutes,
            tags: tags.map(tag => tag.substring(1)), // Remove # from tags
            preview: content.split('\n')[0].substring(0, 100) // First line as preview
        };
    }

    exportNote() {
        const content = this.noteEditor.value.trim();
        if (!content) return;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `note-${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showToast('Note exported');
    }

    exportCurrentNote() {
        if (!this.currentNoteId) return;
        
        const notes = this.getNotes();
        const note = notes.find(n => n.id === this.currentNoteId);
        if (!note) return;

        const blob = new Blob([note.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `note-${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showToast('Note exported');
    }

    showNotes() {
        this.searchView.classList.remove('active');
        this.searchOverlay.classList.remove('active');
        this.notesView.classList.add('active');
        this.notesOverlay.classList.add('active');
        this.loadNotes();
    }

    closeNotes() {
        this.notesView.classList.remove('active');
        this.notesOverlay.classList.remove('active');
    }

    toggleSearch() {
        this.notesView.classList.remove('active');
        this.notesOverlay.classList.remove('active');
        this.searchView.classList.add('active');
        this.searchOverlay.classList.add('active');
        this.searchInput.focus();
    }

    closeSearch() {
        this.searchView.classList.remove('active');
        this.searchOverlay.classList.remove('active');
        this.searchInput.value = '';
        this.searchResults.innerHTML = '<div class="no-results">Type to search...</div>';
    }

    loadNotes() {
        const notes = this.getNotes();
        this.renderNotesList(notes);
    }

    renderNotesList(notes) {
        const notesList = notes.map(note => {
            const metadata = note.title ? 
                `<div class="note-metadata">
                    <span class="note-title">${this.escapeHtml(note.title)}</span>
                    <span class="note-info">
                        ${note.words} words · ${note.readingTime} min read
                        ${note.tags.length ? ` · ${note.tags.map(tag => `#${tag}`).join(' ')}` : ''}
                    </span>
                    <span class="note-date">${this.formatDate(note.modifiedAt)}</span>
                </div>` : '';

            return `<div class="note-item" data-id="${note.id}">
                ${metadata}
                <div class="note-preview">${this.escapeHtml(note.preview)}${note.content.length > 100 ? '...' : ''}</div>
            </div>`;
        }).join('');
        
        this.notesList.innerHTML = notesList || '<div class="no-notes">No notes yet</div>';
    }

    renderMarkdown(text) {
        // Sanitize and render markdown
        const rawHtml = marked.parse(text);
        return DOMPurify.sanitize(rawHtml);
    }

    searchNotes() {
        const query = this.searchInput.value.toLowerCase();
        const searchResults = document.getElementById('searchResults');
        
        if (!query) {
            searchResults.innerHTML = '';
            return;
        }

        const notes = this.getNotes();
        const filteredNotes = notes.filter(note => {
            const content = note.content.toLowerCase();
            return content.includes(query);
        });

        if (filteredNotes.length === 0) {
            searchResults.innerHTML = '<div class="no-notes">No matching notes found</div>';
            return;
        }

        const notesHtml = filteredNotes.map(note => {
            const div = document.createElement('div');
            div.className = 'note-item';
            div.dataset.id = note.id;

            // Get first line as title
            const firstLine = note.content.split('\n')[0];
            const title = firstLine.replace(/^#+ /, '').trim() || 'Untitled Note';
            
            // Get preview text (exclude first line if it's a title)
            const previewLines = note.content.split('\n').slice(firstLine.startsWith('#') ? 1 : 0);
            const preview = previewLines.join(' ').replace(/[#*`_~]/g, '').slice(0, 100);

            div.innerHTML = `
                <div class="note-title">${title}</div>
                <div class="note-preview">${preview}...</div>
                <div class="note-date">${new Date(note.modifiedAt).toLocaleDateString()}</div>
            `;

            return div.outerHTML;
        }).join('');

        searchResults.innerHTML = notesHtml;
    }

    showSearch() {
        this.searchView.classList.add('active');
        this.searchOverlay.classList.add('active');
        this.searchInput.value = ''; // Clear previous search
        this.searchInput.focus(); // Focus the input
        document.getElementById('searchResults').innerHTML = ''; // Clear results
    }

    hideSearch() {
        this.searchView.classList.remove('active');
        this.searchOverlay.classList.remove('active');
        this.searchInput.value = '';
        document.getElementById('searchResults').innerHTML = '';
    }

    getNotes() {
        return JSON.parse(localStorage.getItem('notes') || '[]');
    }

    showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            document.body.removeChild(existingToast);
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }

    debounce(func, delay) {
        let timeoutId;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(context, args), delay);
        };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 24) {
            if (diffInHours < 1) {
                const diffInMinutes = Math.floor((now - date) / (1000 * 60));
                return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
            }
            return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
        }
        
        const options = { month: 'short', day: 'numeric' };
        if (date.getFullYear() !== now.getFullYear()) {
            options.year = 'numeric';
        }
        return date.toLocaleDateString('en-US', options);
    }

    initializePlaceholder() {
        this.placeholderInterval = setInterval(() => {
            if (!this.noteEditor.value.trim() && document.activeElement !== this.noteEditor) {
                this.currentPlaceholderIndex = (this.currentPlaceholderIndex + 1) % this.placeholderMessages.length;
                this.placeholder.textContent = this.placeholderMessages[this.currentPlaceholderIndex];
                this.placeholder.style.opacity = '0';
                setTimeout(() => {
                    this.placeholder.style.opacity = '1';
                }, 150);
            }
        }, 3000);
    }

    handleEditorFocus() {
        if (!this.noteEditor.value.trim()) {
            this.placeholder.classList.add('focused');
        }
    }

    handleEditorBlur() {
        if (!this.noteEditor.value.trim()) {
            this.placeholder.classList.remove('focused');
        }
    }

    handleEditorInput() {
        if (this.noteEditor.value.trim()) {
            this.placeholder.classList.add('hidden');
        } else {
            this.placeholder.classList.remove('hidden');
        }
    }

    animateLogo() {
        if (!this.logo.classList.contains('animate')) {
            this.logo.classList.add('animate');
            setTimeout(() => {
                this.logo.classList.remove('animate');
            }, 1000);
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.metaKey || e.ctrlKey) {
            switch(e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    this.saveNote();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportNote();
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleSearch();
                    break;
            }
        } else if (e.key === 'Escape') {
            this.handleEscapeKey(e);
        }
    }

    handleEscapeKey(event) {
        if (event.key === 'Escape') {
            if (this.searchView.classList.contains('active')) {
                this.hideSearch();
            } else if (this.notesView.classList.contains('active')) {
                this.hideNotes();
            } else if (this.noteDetailView.classList.contains('active')) {
                this.closeNoteDetail();
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NoteApp();
});
