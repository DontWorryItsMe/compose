class NoteApp {
    constructor() {
        this.notes = [];
        this.initializeElements();
        this.loadNotes();
        this.setupEventListeners();
        this.setupAnimations();
        this.setupCustomCursor();
        this.currentNoteId = null;

        // Initialize marked options
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false,
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
        // Back button handlers
        this.backButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = btn.closest('.side-view, .note-detail-view').id;
                if (view === 'noteDetailView') {
                    this.hideView('noteDetail');
                } else {
                    this.hideView(view.replace('View', '').toLowerCase());
                }
            });
        });

        // Show notes button
        this.showNotesBtn.addEventListener('click', () => {
            this.showView('notes');
        });

        // Search button
        this.searchBtn.addEventListener('click', () => {
            this.showView('search');
        });

        // Save note button
        this.saveNoteBtn.addEventListener('click', () => {
            this.saveNote();
        });

        // Export button
        this.exportBtn.addEventListener('click', () => {
            this.exportNotes();
        });

        // Overlay click handlers
        this.searchOverlay.addEventListener('click', () => {
            this.hideView('search');
        });

        this.notesOverlay.addEventListener('click', () => {
            this.hideView('notes');
        });

        this.noteDetailOverlay.addEventListener('click', () => {
            this.hideView('noteDetail');
        });

        // Search input
        this.searchInput.addEventListener('input', this.debounce(() => {
            this.performSearch(this.searchInput.value);
        }, 300));

        // Note editor
        this.noteEditor.addEventListener('input', this.debounce(() => {
            this.updatePreview();
        }, 300));

        // Note editor focus events
        this.noteEditor.addEventListener('focus', () => {
            if (this.placeholder) {
                this.placeholder.classList.add('hidden');
            }
        });

        this.noteEditor.addEventListener('blur', () => {
            if (this.placeholder && !this.noteEditor.value) {
                this.placeholder.classList.remove('hidden');
            }
        });

        // Delete note button
        this.deleteNoteBtn.addEventListener('click', () => {
            this.showDeleteConfirmation();
        });

        // Edit note button
        this.editNoteBtn.addEventListener('click', () => {
            this.editCurrentNote();
        });

        // Export detail button
        this.exportDetailBtn.addEventListener('click', () => {
            if (this.currentNoteId) {
                this.exportNote(this.currentNoteId);
            }
        });

        // Delete confirmation modal
        this.confirmDeleteBtn.addEventListener('click', () => {
            this.deleteCurrentNote();
            this.hideDeleteConfirmation();
        });

        this.cancelDeleteBtn.addEventListener('click', () => {
            this.hideDeleteConfirmation();
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only handle keyboard shortcuts when not in an input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Escape') {
                const activeView = ['search', 'notes', 'noteDetail'].find(view => 
                    this[`${view}View`].classList.contains('active')
                );
                if (activeView) {
                    this.hideView(activeView);
                }
            }
        });
    }

    loadNotes() {
        try {
            const savedNotes = localStorage.getItem('notes');
            this.notes = savedNotes ? JSON.parse(savedNotes) : [];
            this.renderNotesList();
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
        }
    }

    showView(viewName) {
        // Hide all views first
        ['notes', 'search', 'noteDetail'].forEach(name => {
            const view = this[`${name}View`];
            const overlay = this[`${name}Overlay`];
            if (view && overlay) {
                view.classList.remove('active');
                overlay.classList.remove('active');
            }
        });

        // Show the requested view
        const view = this[`${viewName}View`];
        const overlay = this[`${viewName}Overlay`];
        if (view && overlay) {
            view.classList.add('active');
            overlay.classList.add('active');

            // Special handling for search view
            if (viewName === 'search') {
                this.searchInput.focus();
            }
        }
    }

    hideView(viewName) {
        const view = this[`${viewName}View`];
        const overlay = this[`${viewName}Overlay`];
        if (view && overlay) {
            view.classList.remove('active');
            overlay.classList.remove('active');
            
            // Reset current note ID when closing note detail
            if (viewName === 'noteDetail') {
                this.currentNoteId = null;
            }
        }
    }

    saveNote() {
        const content = this.noteEditor.value.trim();
        if (!content) return;

        const now = new Date().getTime();
        
        if (this.currentNoteId) {
            // Update existing note
            const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
            if (noteIndex !== -1) {
                this.notes[noteIndex] = {
                    ...this.notes[noteIndex],
                    content,
                    lastModified: now
                };
            }
        } else {
            // Create new note
            const newNote = {
                id: now,
                content,
                created: now,
                lastModified: now
            };
            this.notes.unshift(newNote);
        }

        // Save to localStorage
        localStorage.setItem('notes', JSON.stringify(this.notes));
        
        // Clear editor and reset currentNoteId
        this.noteEditor.value = '';
        this.currentNoteId = null;
        
        // Show the updated notes list
        this.renderNotesList();
        this.showView('notes');
    }

    showDeleteConfirmation() {
        this.confirmationModal.classList.add('active');
        
        // Add event listener for clicking outside the modal
        const handleOutsideClick = (e) => {
            if (e.target === this.confirmationModal) {
                this.hideDeleteConfirmation();
                this.confirmationModal.removeEventListener('click', handleOutsideClick);
            }
        };
        
        this.confirmationModal.addEventListener('click', handleOutsideClick);
        
        // Add escape key handler
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.hideDeleteConfirmation();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        
        document.addEventListener('keydown', handleEscape);
    }

    hideDeleteConfirmation() {
        this.confirmationModal.classList.remove('active');
    }

    showNoteDetail(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        this.currentNoteId = noteId;
        
        // Update note detail view content
        const noteContent = document.querySelector('.note-content');
        noteContent.innerHTML = marked.parse(note.content);
        
        // Show the view
        this.showView('noteDetail');
    }

    performSearch(query) {
        if (!query) {
            this.searchResults.innerHTML = '<div class="no-results">Type to search...</div>';
            return;
        }

        const results = this.notes.filter(note => {
            const content = note.content.toLowerCase();
            const terms = query.toLowerCase().split(' ');
            return terms.every(term => content.includes(term));
        });

        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="no-results">No notes found</div>';
            return;
        }

        this.searchResults.innerHTML = results.map(note => `
            <div class="note-item" data-id="${note.id}">
                <div class="note-metadata">
                    <div class="note-title">${this.getNoteTitleFromContent(note.content)}</div>
                    <div class="note-info">${this.getWordCount(note.content)} words</div>
                    <div class="note-date">${new Date(note.lastModified).toLocaleDateString()}</div>
                </div>
                <div class="note-preview">${this.highlightSearchTerms(this.getPreviewText(note.content), query)}</div>
            </div>
        `).join('');

        // Add click handlers to search results
        this.searchResults.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = parseInt(item.dataset.id);
                this.showNoteDetail(noteId);
            });
        });
    }

    editCurrentNote() {
        if (!this.currentNoteId) return;
        
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note) return;
        
        this.noteEditor.value = note.content;
        this.hideView('noteDetail');
        this.updatePreview();
    }

    deleteCurrentNote() {
        if (!this.currentNoteId) return;
        
        this.notes = this.notes.filter(note => note.id !== this.currentNoteId);
        localStorage.setItem('notes', JSON.stringify(this.notes));
        
        this.currentNoteId = null;
        this.hideView('noteDetail');
        this.renderNotesList();
    }

    handleEscapeKey() {
        // Find the currently active view
        const activeView = Object.entries(this.sliders).find(([_, slider]) => 
            Math.abs(slider.currentTranslate) < window.innerWidth / 2
        );

        if (activeView) {
            this.hideView(activeView[0]);
        }
    }

    handleResize() {
        // Update slider positions for hidden views
        Object.entries(this.sliders).forEach(([name, slider]) => {
            if (Math.abs(slider.currentTranslate) >= window.innerWidth / 2) {
                slider.slideTo(window.innerWidth, false);
            }
        });
    }

    renderNotesList() {
        if (this.notes.length === 0) {
            this.notesList.innerHTML = '<div class="no-notes">No notes yet. Start writing!</div>';
            return;
        }

        this.notesList.innerHTML = this.notes.map(note => `
            <div class="note-item" data-id="${note.id}">
                <div class="note-metadata">
                    <div class="note-title">${this.getNoteTitleFromContent(note.content)}</div>
                    <div class="note-info">${this.getWordCount(note.content)} words</div>
                    <div class="note-date">${new Date(note.lastModified).toLocaleDateString()}</div>
                </div>
                <div class="note-preview">${this.getPreviewText(note.content)}</div>
            </div>
        `).join('');

        // Add click handlers to note items
        this.notesList.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = parseInt(item.dataset.id);
                this.showNoteDetail(noteId);
            });
        });
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

    exportNote(noteId = null) {
        let content;
        let filename;

        if (noteId) {
            const note = this.notes.find(n => n.id === noteId);
            if (!note) return;
            content = note.content;
            filename = `note-${noteId}`;
        } else {
            content = this.noteEditor.value.trim();
            if (!content) return;
            filename = `note-${new Date().getTime()}`;
        }

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportNotes() {
        const notesExport = {
            notes: this.notes,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(notesExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    getNoteTitleFromContent(content) {
        const firstLine = content.split('\n')[0];
        return firstLine || 'Untitled Note';
    }

    getPreviewText(content) {
        const previewLength = 150;
        return content.length > previewLength 
            ? content.substring(0, previewLength) + '...'
            : content;
    }

    getWordCount(content) {
        return content.trim().split(/\s+/).length;
    }

    highlightSearchTerms(text, query) {
        const terms = query.toLowerCase().split(' ');
        let highlightedText = text;
        
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    renderNotesList() {
        if (this.notes.length === 0) {
            this.notesList.innerHTML = '<div class="no-notes">No notes yet. Start writing!</div>';
            return;
        }

        this.notesList.innerHTML = this.notes.map(note => `
            <div class="note-item" data-id="${note.id}">
                <div class="note-metadata">
                    <div class="note-title">${this.getNoteTitleFromContent(note.content)}</div>
                    <div class="note-info">${this.getWordCount(note.content)} words</div>
                    <div class="note-date">${new Date(note.lastModified).toLocaleDateString()}</div>
                </div>
                <div class="note-preview">${this.getPreviewText(note.content)}</div>
            </div>
        `).join('');

        // Add click handlers to note items
        this.notesList.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = parseInt(item.dataset.id);
                this.showNoteDetail(noteId);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NoteApp();
});
