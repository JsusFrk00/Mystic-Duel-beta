// Developer Mode with AI Assistant (Hidden)
class DeveloperMode {
    constructor() {
        this.isActive = false;
        this.aiProvider = localStorage.getItem('devModeProvider') || 'gemini';
        this.apiKey = localStorage.getItem('devModeApiKey') || '';
        this.conversation = [];
        this.gameContext = null;
        this.fileContents = new Map();
    }

    async initialize() {
        console.log('Developer Mode: Initializing...');
        // Load game file contents for context
        await this.loadGameContext();
        this.createUI();
        this.bindEvents();
        console.log('Developer Mode: Ready! Press Ctrl+Alt+M to open.');
    }

    async loadGameContext() {
        // Load actual game file contents for AI context
        this.gameContext = {
            version: "1.0.0",
            modules: [
                'js/main.js',
                'js/game/Game.js', 
                'js/game/Card.js',
                'js/data/cards.js',
                'js/data/abilities.js',
                'js/deckbuilder/deckbuilder.js',
                'js/store/store.js',
                'js/store/collection.js',
                'js/ui/ui.js',
                'js/utils/storage.js',
                'js/debug/debug.js'
            ],
            currentGameState: null
        };

        // Load real file contents for better AI assistance
        try {
            // Try to load actual game files
            const gameFile = await this.loadFileContent('js/game/Game.js');
            const cardFile = await this.loadFileContent('js/data/cards.js');
            const deckbuilderFile = await this.loadFileContent('js/deckbuilder/deckbuilder.js');
            
            this.fileContents.set('Game.js', gameFile);
            this.fileContents.set('cards.js', cardFile);
            this.fileContents.set('deckbuilder.js', deckbuilderFile);
            
            // Store comprehensive game structure with actual insights
            this.fileContents.set('structure', `
Mystic Duel - Complete Game Structure:

🎮 CORE GAME MECHANICS:
- Turn-based card game with mana system (1-10 mana per turn)
- 30-card decks, 7-card hand limit, 7-creature field limit
- Player vs AI with intelligent deck power balancing
- 150+ cards across 4 rarities: common (1 power), rare (2), epic (3), legendary (4)

🤖 AI DECK BALANCING SYSTEM:
- calculateDeckPower(): Sums card rarity power values
- createBalancedAIDeck(): Creates AI deck within ±5 power of player
- Smart card selection based on remaining power needed
- Ensures fair matches regardless of player collection

🎴 CARD SYSTEM:
- Creatures: Have attack/health, can have abilities
- Spells: Instant effects (damage, healing, buffs)
- 60+ unique abilities: Flying, Taunt, Lifesteal, Enrage, etc.
- Complex combat system with First Strike, Poison, Divine Shield

💰 ECONOMY:
- Gold: Earned from wins, daily rewards, duplicate cards
- Gems: Premium currency for special packs
- Pack system with different rarity rates
- Store rotates singles every 6 hours

🏗️ FILE ARCHITECTURE:
- js/game/Game.js: Core game logic, 800+ lines
- js/game/Card.js: Card class with abilities
- js/data/cards.js: All 150 card definitions
- js/deckbuilder/: Deck creation and management
- js/store/: Shop and collection systems
- js/ui/: Display and interaction handling

${gameFile ? '📋 ACTUAL GAME.JS INSIGHTS:\n' + this.extractKeyFeatures(gameFile) : ''}
        `);
        } catch (error) {
            console.log('Could not load actual files, using basic structure');
            // Fallback to basic structure if file loading fails
            this.fileContents.set('structure', `
Game Structure (Basic):
- index.html: Main game file
- css/styles.css: Game styling  
- js/: JavaScript modules (modular structure)

Note: Unable to load actual file contents for detailed analysis.
        `);
        }
    }

    // Code Editor Methods
    currentFileName = null;
    originalFileContent = null;
    backupFiles = new Map();
    changeCount = 0;

    async loadFileToEditor() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.js,.html,.css,.json,.md';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const content = await file.text();
                this.loadContentToEditor(file.name, content);
            }
        };
        
        input.click();
    }

    loadContentToEditor(fileName, content) {
        this.currentFileName = fileName;
        this.originalFileContent = content;
        this.changeCount = 0;
        
        document.getElementById('editorFileName').textContent = fileName;
        document.getElementById('codeTextarea').value = content;
        document.getElementById('fileStatus').textContent = 'Loaded';
        document.getElementById('changeCount').textContent = '0';
        
        // Store in fileContents for AI context
        this.fileContents.set(fileName, content);
        
        this.updateEditorStatus();
    }

    trackCodeChanges() {
        if (this.originalFileContent) {
            const currentContent = document.getElementById('codeTextarea').value;
            const hasChanges = currentContent !== this.originalFileContent;
            
            if (hasChanges) {
                this.changeCount++;
                document.getElementById('fileStatus').textContent = 'Modified';
                document.getElementById('fileStatus').style.color = '#FFC107';
            } else {
                document.getElementById('fileStatus').textContent = 'Saved';
                document.getElementById('fileStatus').style.color = '#4CAF50';
            }
            
            document.getElementById('changeCount').textContent = this.changeCount;
            this.generateDiff();
        }
    }

    generateDiff() {
        if (!this.originalFileContent) return;
        
        const currentContent = document.getElementById('codeTextarea').value;
        const originalLines = this.originalFileContent.split('\n');
        const currentLines = currentContent.split('\n');
        
        let diffHtml = '';
        let hasChanges = false;
        const contextSize = 2; // Show 2 lines of context around changes
        
        // Find all changed line ranges
        const changes = [];
        for (let i = 0; i < Math.max(originalLines.length, currentLines.length); i++) {
            const oldLine = originalLines[i] || '';
            const newLine = currentLines[i] || '';
            
            if (oldLine !== newLine) {
                changes.push(i);
                hasChanges = true;
            }
        }
        
        if (!hasChanges) {
            document.getElementById('diffDisplay').innerHTML = '✅ No changes detected';
            return;
        }
        
        // Group changes into sections with context
        const sections = [];
        let currentSection = null;
        
        for (const lineNum of changes) {
            if (!currentSection || lineNum > currentSection.end + contextSize * 2) {
                // Start new section
                currentSection = {
                    start: Math.max(0, lineNum - contextSize),
                    end: Math.min(Math.max(originalLines.length, currentLines.length) - 1, lineNum + contextSize),
                    changes: [lineNum]
                };
                sections.push(currentSection);
            } else {
                // Extend current section
                currentSection.end = Math.min(Math.max(originalLines.length, currentLines.length) - 1, lineNum + contextSize);
                currentSection.changes.push(lineNum);
            }
        }
        
        // Generate diff HTML for each section
        sections.forEach((section, sectionIndex) => {
            if (sectionIndex > 0) {
                diffHtml += '<div style="margin: 10px 0; color: #666; text-align: center;">...</div>';
            }
            
            for (let i = section.start; i <= section.end; i++) {
                const oldLine = originalLines[i] || '';
                const newLine = currentLines[i] || '';
                const isChanged = section.changes.includes(i);
                
                if (isChanged) {
                    if (oldLine && newLine) {
                        diffHtml += `<div class="diff-removed">- ${this.escapeHtml(oldLine)}</div>`;
                        diffHtml += `<div class="diff-added">+ ${this.escapeHtml(newLine)}</div>`;
                    } else if (oldLine) {
                        diffHtml += `<div class="diff-removed">- ${this.escapeHtml(oldLine)}</div>`;
                    } else {
                        diffHtml += `<div class="diff-added">+ ${this.escapeHtml(newLine)}</div>`;
                    }
                } else if (oldLine) {
                    diffHtml += `<div class="diff-context">  ${this.escapeHtml(oldLine)}</div>`;
                }
            }
        });
        
        // Add summary
        const addedLines = changes.filter(i => !originalLines[i] && currentLines[i]).length;
        const removedLines = changes.filter(i => originalLines[i] && !currentLines[i]).length;
        const modifiedLines = changes.filter(i => originalLines[i] && currentLines[i]).length;
        
        const summary = `<div style="background: rgba(0,188,212,0.1); padding: 10px; margin-bottom: 15px; border-radius: 5px;">
            <strong>📊 Change Summary:</strong><br>
            ✅ ${modifiedLines} lines modified<br>
            ➕ ${addedLines} lines added<br>
            ➖ ${removedLines} lines removed
        </div>`;
        
        document.getElementById('diffDisplay').innerHTML = summary + diffHtml;
    }

    downloadEditedFile() {
        if (!this.currentFileName) {
            this.showCustomAlert('No file loaded to download!');
            return;
        }
        
        const content = document.getElementById('codeTextarea').value;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentFileName;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.addChatMessage(`📁 Downloaded ${this.currentFileName}`, 'system');
    }

    createBackup() {
        if (!this.currentFileName || !this.originalFileContent) {
            this.showCustomAlert('No file loaded to backup!');
            return;
        }
        
        const timestamp = new Date().toISOString();
        this.backupFiles.set(`${this.currentFileName}_${timestamp}`, this.originalFileContent);
        
        document.getElementById('lastBackup').textContent = new Date().toLocaleTimeString();
        
        this.addChatMessage(`🔄 Backup created for ${this.currentFileName}`, 'system');
    }

    async askAIToEdit() {
        if (!this.currentFileName) {
            this.showCustomAlert('Please load a file first!');
            return;
        }
        
        const editRequest = await this.showCustomPrompt(
            '🤖 What would you like the AI to do with this file?',
            `Examples:\n• "Add a new legendary dragon card"\n• "Fix the card balancing issue"\n• "Add error handling to this function"\n• "Optimize this code for performance"\n\nEnter your request:`,
            'Add a new legendary dragon card'
        );
        
        if (!editRequest) return;
        
        const currentContent = document.getElementById('codeTextarea').value;
        
        try {
            const aiEditContext = `
You are editing a JavaScript file for the Mystic Duel card game.

File: ${this.currentFileName}
Request: ${editRequest}

Current file content:
\`\`\`javascript
${currentContent}
\`\`\`

IMPORTANT INSTRUCTIONS:
1. Return ONLY the complete modified JavaScript code
2. Do NOT include any explanations, comments about changes, or markdown
3. Do NOT wrap in \`\`\`javascript blocks - just return raw code
4. Make meaningful changes that actually address the request
5. Preserve all existing functionality while adding the requested features
6. For AI strategy requests, modify the aiTurn() method and targeting logic
7. For deck power requests, modify calculateDeckPower() and createBalancedAIDeck() methods
8. Test that your changes make logical sense

Return the complete file with your modifications:`;
            
            this.addChatMessage(`AI is editing ${this.currentFileName}...`, 'system');
            
            const aiResponse = await this.getAIResponse(aiEditContext);
            
            // Extract code from AI response (remove any markdown formatting)
            let editedContent = aiResponse.trim();
            
            // Handle multiple possible markdown formats
            if (editedContent.includes('```')) {
                // Try different markdown patterns
                let codeMatch = editedContent.match(/```(?:javascript|js)?\s*\n([\s\S]*?)```/);
                
                // If that fails, try without language specifier
                if (!codeMatch) {
                    codeMatch = editedContent.match(/```([\s\S]*?)```/);
                }
                
                // If that fails, try to extract everything between first and last ```
                if (!codeMatch) {
                    const firstBacktick = editedContent.indexOf('```');
                    const lastBacktick = editedContent.lastIndexOf('```');
                    if (firstBacktick !== -1 && lastBacktick !== -1 && lastBacktick > firstBacktick) {
                        // Find the end of the first ``` line
                        const firstLineEnd = editedContent.indexOf('\n', firstBacktick);
                        editedContent = editedContent.substring(firstLineEnd + 1, lastBacktick).trim();
                    }
                } else {
                    editedContent = codeMatch[1].trim();
                }
            }
            
            // Remove any remaining markdown artifacts
            editedContent = editedContent.replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();
            
            // Validate that we got actual code
            if (editedContent.length < 50) {
                throw new Error('AI response too short - may not contain valid code');
            }
            
            // Check if it looks like code
            if (!editedContent.includes('{') && !editedContent.includes('function') && !editedContent.includes('class')) {
                throw new Error('AI response does not appear to contain valid code');
            }
            
            // Update the editor
            document.getElementById('codeTextarea').value = editedContent;
            this.fileContents.set(this.currentFileName, editedContent);
            
            // Update status
            document.getElementById('fileStatus').textContent = 'AI Modified';
            document.getElementById('fileStatus').style.color = '#4CAF50';
            
            // Generate diff
            this.generateDiff();
            
            // Switch to diff view
            this.switchEditorTab('diff');
            
            this.addChatMessage(`✅ AI has modified ${this.currentFileName}. Check the Changes tab to review.`, 'assistant');
            
        } catch (error) {
            this.addChatMessage(`❌ AI editing failed: ${error.message}`, 'error');
        }
    }

    async handleQuickAction(action) {
        const quickActions = {
            addCard: 'Add a new card to the game with these specifications: [specify rarity, abilities, stats]',
            fixBug: 'Review this code and fix any common bugs or issues you find',
            addAbility: 'Add a new card ability to the game with appropriate mechanics',
            balanceDeck: 'Review and adjust the deck balancing system for better gameplay',
            optimizeCode: 'Optimize this code for better performance and readability'
        };
        
        const defaultPrompt = quickActions[action] || 'Improve this code';
        const customPrompt = await this.showCustomPrompt(
            `Quick Action: ${action}`,
            `Customize the request or use default:\n\n${defaultPrompt}`,
            defaultPrompt
        );
        
        if (customPrompt) {
            // Load appropriate file if none is loaded
            if (!this.currentFileName) {
                if (customPrompt.toLowerCase().includes('card')) {
                    const cardFileContent = this.fileContents.get('cards.js');
                    if (cardFileContent) {
                        this.loadContentToEditor('cards.js', cardFileContent);
                    }
                }
            }
            
            // Simulate the edit request
            this.addChatMessage(`🚀 Quick Action: ${action}`, 'user');
            
            // Create a fake edit request and process it
            const currentContent = document.getElementById('codeTextarea').value || this.generateFileTemplate('cards.js');
            
            try {
                const aiEditContext = `
File Editing Request:
File: ${this.currentFileName || 'cards.js'}
Current Content:
\`\`\`javascript
${currentContent}
\`\`\`

User Request: ${customPrompt}

Please provide the complete modified file content. Return ONLY the complete file content, no explanations.`;
                
                const aiResponse = await this.getAIResponse(aiEditContext);
                
                // Process the AI response
                let editedContent = aiResponse;
                if (editedContent.includes('```')) {
                    const codeMatch = editedContent.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
                    if (codeMatch) {
                        editedContent = codeMatch[1];
                    }
                }
                
                // Update the editor
                if (!this.currentFileName) {
                    this.loadContentToEditor('cards.js', editedContent);
                    this.switchTab('editor');
                } else {
                    document.getElementById('codeTextarea').value = editedContent;
                    this.fileContents.set(this.currentFileName, editedContent);
                }
                
                this.generateDiff();
                this.switchEditorTab('diff');
                
                this.addChatMessage(`✅ Quick Action completed! Check the Code Editor tab.`, 'assistant');
                
            } catch (error) {
                this.addChatMessage(`❌ Quick action failed: ${error.message}`, 'error');
            }
        }
    }

    switchEditorTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.editor-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.editorTab === tabName);
        });
        
        // Update content
        document.querySelectorAll('.editor-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(tabName === 'code' ? 'codeEditor' : 
                                                 tabName === 'diff' ? 'diffViewer' : 'previewPanel');
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Update preview if switching to preview tab
        if (tabName === 'preview') {
            this.updatePreview();
        }
    }

    updatePreview() {
        const content = document.getElementById('codeTextarea').value;
        const preview = document.getElementById('previewContent');
        
        if (this.currentFileName && this.currentFileName.includes('cards.js')) {
            // Preview for cards.js - show cards that would be added/modified
            try {
                const cardMatches = content.match(/\{[^}]*name[^}]*\}/g);
                if (cardMatches) {
                    let previewHtml = '<h5>🎴 Cards Preview:</h5>';
                    cardMatches.slice(-5).forEach(match => {
                        try {
                            const cardData = eval('(' + match + ')');
                            previewHtml += `
                                <div style="border: 1px solid #00bcd4; padding: 10px; margin: 5px 0; border-radius: 5px;">
                                    <strong>${cardData.emoji || '🎴'} ${cardData.name || 'Unknown'}</strong>
                                    <div>Cost: ${cardData.cost || '?'} | Type: ${cardData.type || '?'}</div>
                                    <div>Stats: ${cardData.attack || '?'}/${cardData.health || '?'}</div>
                                    <div>Ability: ${cardData.ability || 'None'}</div>
                                    <div style="color: ${{'common': '#888', 'rare': '#00c9ff', 'epic': '#8e2de2', 'legendary': '#ffd700'}[cardData.rarity] || '#fff'}">Rarity: ${cardData.rarity || 'unknown'}</div>
                                </div>
                            `;
                        } catch (e) {
                            // Skip invalid card data
                        }
                    });
                    preview.innerHTML = previewHtml;
                } else {
                    preview.innerHTML = 'No card data found in this file.';
                }
            } catch (error) {
                preview.innerHTML = `Preview error: ${error.message}`;
            }
        } else {
            // Generic preview for other files
            preview.innerHTML = `
                <h5>📋 File Summary:</h5>
                <div>Lines: ${content.split('\n').length}</div>
                <div>Characters: ${content.length}</div>
                <div>File: ${this.currentFileName || 'Unnamed'}</div>
                <div>Status: ${document.getElementById('fileStatus').textContent}</div>
                
                <h5>🔍 Recent Changes:</h5>
                <div>${this.changeCount > 0 ? `${this.changeCount} modifications detected` : 'No changes'}</div>
            `;
        }
    }

    updateEditorStatus() {
        // Update various status indicators
        if (this.currentFileName) {
            document.getElementById('fileStatus').textContent = 'Ready';
            document.getElementById('fileStatus').style.color = '#4CAF50';
        }
    }

    async loadFileContent(filePath) {
        try {
            // Try to load from the actual file system
            const response = await fetch(filePath);
            if (response.ok) {
                return await response.text();
            }
        } catch (error) {
            // File loading failed
        }
        return null;
    }

    extractKeyFeatures(gameCode) {
        const features = [];
        
        if (gameCode.includes('calculateDeckPower')) {
            features.push('✅ Deck Power Balancing System Active');
        }
        if (gameCode.includes('createBalancedAIDeck')) {
            features.push('🤖 AI Deck Balancing: Matches player power ±5 points');
        }
        if (gameCode.includes('Enrage')) {
            features.push('⚔️ Complex Combat: Enrage, First Strike, Poison, etc.');
        }
        if (gameCode.includes('handleSpellTargeting')) {
            features.push('🎯 Spell Targeting System');
        }
        if (gameCode.includes('Burn')) {
            features.push('🔥 Advanced Abilities: Burn, Regenerate, Flying, etc.');
        }
        if (gameCode.includes('graveyard')) {
            features.push('💀 Graveyard System: Death effects and resurrection');
        }
        
        return features.join('\n');
    }

    createUI() {
        // Create developer panel (hidden by default)
        const devPanel = document.createElement('div');
        devPanel.id = 'developer-panel';
        devPanel.className = 'developer-panel';
        devPanel.innerHTML = `
            <div class="dev-header">
                <h3>🔧 Developer Mode - AI Assistant</h3>
                <button class="dev-close-btn" id="devCloseBtn">✕</button>
            </div>
            
            <div class="dev-settings">
                <select id="aiProviderSelect" class="ai-provider-select">
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI GPT</option>
                    <option value="local">Local (Ollama)</option>
                    <option value="none">No AI (Manual Mode)</option>
                </select>
                
                <input type="password" id="apiKeyInput" 
                       placeholder="Enter API Key" 
                       class="api-key-input">
                
                <button id="saveSettingsBtn" class="save-settings-btn">Save</button>
            </div>

            <div class="dev-tabs">
            <button class="dev-tab active" data-tab="chat">AI Chat</button>
            <button class="dev-tab" data-tab="files">Files</button>
            <button class="dev-tab" data-tab="editor">Code Editor</button>
            <button class="dev-tab" data-tab="state">Game State</button>
            <button class="dev-tab" data-tab="console">Console</button>
                <button class="dev-tab" data-tab="tools">Tools</button>
                </div>

            <div class="dev-content">
                <!-- Chat Tab -->
                <div class="dev-tab-content active" id="chatTab">
                    <div class="chat-messages" id="chatMessages">
                        <div class="chat-message assistant">
                            <strong>AI Assistant:</strong> 
                            Welcome to your game development assistant! 🎮✨
                            
                            <div style="margin: 10px 0; padding: 10px; background: rgba(0,188,212,0.1); border-radius: 8px;">
                                <strong>🚀 Quick Setup:</strong><br>
                                1. Get a <em>free</em> API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" style="color: #00bcd4;">Google AI Studio</a><br>
                                2. Select "Google Gemini" above ⬆️<br>
                                3. Paste your key and click "Save"<br><br>
                                <strong>🔧 Having 404 errors?</strong> Go to the <strong>Tools</strong> tab and click <strong>"Test API Connection"</strong> for detailed diagnostics!<br><br>
                                <em>Or choose "No AI" for built-in help without setup!</em>
                            </div>
                            
                            I can help you with:
                            <ul>
                                <li>🐛 Debug game issues and errors</li>
                                <li>🎴 Create new cards and abilities</li>
                                <li>📚 Explain how game systems work</li>
                                <li>🎨 Fix CSS and layout problems</li>
                                <li>⚖️ Balance gameplay mechanics</li>
                                <li>💻 Write and improve code</li>
                            </ul>
                            
                            Try asking: <em>"How do I add a new card ability?"</em> or <em>"Why aren't my cards saving?"</em>
                        </div>
                    </div>
                    <div class="chat-input-area">
                        <textarea id="chatInput" 
                                  placeholder="Ask about bugs, features, or code..." 
                                  class="chat-input"></textarea>
                        <button id="sendBtn" class="send-btn">Send</button>
                    </div>
                </div>

                <!-- Files Tab -->
                <div class="dev-tab-content" id="filesTab">
                    <div class="file-browser">
                        <div class="file-tree" id="fileTree"></div>
                        <div class="file-viewer">
                            <div class="file-header" id="fileHeader">Select a file to view</div>
                            <pre class="file-content" id="fileContent"></pre>
                        </div>
                    </div>
                </div>

                <!-- Code Editor Tab -->
                <div class="dev-tab-content" id="editorTab">
                    <div class="code-editor-container">
                        <div class="editor-header">
                            <div class="editor-file-info">
                                <span id="editorFileName">No file selected</span>
                                <div class="editor-actions">
                                    <button id="loadFileBtn" class="editor-btn">📁 Load File</button>
                                    <button id="saveFileBtn" class="editor-btn">💾 Download</button>
                                    <button id="backupBtn" class="editor-btn">🔄 Backup</button>
                                    <button id="askAIEditBtn" class="editor-btn ai-edit-btn">🤖 Ask AI to Edit</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="editor-main">
                            <div class="editor-sidebar">
                                <h4>Quick Actions</h4>
                                <button class="quick-action-btn" data-action="addCard">➕ Add New Card</button>
                                <button class="quick-action-btn" data-action="fixBug">🐛 Fix Common Bug</button>
                                <button class="quick-action-btn" data-action="addAbility">⚡ Add New Ability</button>
                                <button class="quick-action-btn" data-action="balanceDeck">⚖️ Adjust Deck Balance</button>
                                <button class="quick-action-btn" data-action="optimizeCode">🚀 Optimize Code</button>
                                
                                <div class="editor-status" id="editorStatus">
                                    <div class="status-item">
                                        <strong>File Status:</strong>
                                        <span id="fileStatus">Ready</span>
                                    </div>
                                    <div class="status-item">
                                        <strong>Changes:</strong>
                                        <span id="changeCount">0</span>
                                    </div>
                                    <div class="status-item">
                                        <strong>Last Backup:</strong>
                                        <span id="lastBackup">None</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="editor-workspace">
                                <div class="editor-tabs">
                                    <button class="editor-tab active" data-editor-tab="code">📝 Code</button>
                                    <button class="editor-tab" data-editor-tab="diff">🔍 Changes</button>
                                    <button class="editor-tab" data-editor-tab="preview">👁️ Preview</button>
                                </div>
                                
                                <div class="editor-content">
                                    <div class="editor-tab-content active" id="codeEditor">
                                        <textarea id="codeTextarea" class="code-textarea" placeholder="Load a file or paste code here...\n\n// You can:\n// 1. Load existing game files\n// 2. Let AI edit them\n// 3. Download the modified files\n// 4. Replace the originals\n\nExample: Ask AI to 'Add a new legendary dragon card'\nand it will modify your cards.js file!"></textarea>
                                    </div>
                                    
                                    <div class="editor-tab-content" id="diffViewer">
                                        <div class="diff-container">
                                            <h4>📋 Proposed Changes</h4>
                                            <div id="diffDisplay">No changes to display</div>
                                        </div>
                                    </div>
                                    
                                    <div class="editor-tab-content" id="previewPanel">
                                        <div class="preview-container">
                                            <h4>🎮 Live Preview</h4>
                                            <div id="previewContent">Preview will show here...</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Game State Tab -->
                <div class="dev-tab-content" id="stateTab">
                    <div class="state-viewer">
                        <h4>Current Game State</h4>
                        <pre id="gameStateDisplay"></pre>
                        <button id="refreshStateBtn">Refresh State</button>
                        <button id="exportStateBtn">Export State</button>
                    </div>
                </div>

                <!-- Console Tab -->
                <div class="dev-tab-content" id="consoleTab">
                    <div class="console-output" id="consoleOutput"></div>
                    <div class="console-input-area">
                        <input type="text" id="consoleInput" 
                               placeholder="Enter JavaScript code..." 
                               class="console-input">
                        <button id="executeBtn">Execute</button>
                    </div>
                </div>

                <!-- Tools Tab -->
                <div class="dev-tab-content" id="toolsTab">
                    <div class="dev-tools">
                        <h4>Developer Tools</h4>
                        <button class="tool-btn" data-tool="loadGameFile">📂 Load Game File to Editor</button>
                        <button class="tool-btn" data-tool="testConnection">Test API Connection</button>
                        <button class="tool-btn" data-tool="generateCard">Generate New Card</button>
                        <button class="tool-btn" data-tool="testDeck">Test Deck Power</button>
                        <button class="tool-btn" data-tool="simulateBattle">Simulate Battle</button>
                        <button class="tool-btn" data-tool="validateCards">Validate All Cards</button>
                        <button class="tool-btn" data-tool="exportData">Export Game Data</button>
                        <button class="tool-btn" data-tool="clearCache">Clear Cache</button>
                        <button class="tool-btn" data-tool="resetProgress">Reset Progress</button>
                        
                        <div class="tool-output" id="toolOutput"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(devPanel);

        // Add styles
        this.addStyles();
        
        // Set initial provider selection
        const providerSelect = document.getElementById('aiProviderSelect');
        if (providerSelect) {
            providerSelect.value = this.aiProvider;
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .developer-panel {
                position: fixed;
                top: 0;
                right: -600px;
                width: 600px;
                height: 100vh;
                background: rgba(20, 20, 30, 0.98);
                border-left: 2px solid #00bcd4;
                color: white;
                transition: right 0.3s ease;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                font-family: 'Courier New', monospace;
            }

            .developer-panel.active {
                right: 0;
            }

            .dev-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: rgba(0, 188, 212, 0.2);
                border-bottom: 1px solid #00bcd4;
            }

            .dev-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
            }

            .dev-settings {
                display: flex;
                gap: 10px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-bottom: 1px solid #333;
            }

            .ai-provider-select, .api-key-input {
                flex: 1;
                padding: 5px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #444;
                color: white;
                border-radius: 4px;
            }

            .save-settings-btn {
                padding: 5px 15px;
                background: #00bcd4;
                border: none;
                color: white;
                border-radius: 4px;
                cursor: pointer;
            }

            .dev-tabs {
                display: flex;
                background: rgba(0, 0, 0, 0.5);
                border-bottom: 1px solid #333;
            }

            .dev-tab {
                flex: 1;
                padding: 10px;
                background: none;
                border: none;
                color: #888;
                cursor: pointer;
                transition: all 0.3s;
            }

            .dev-tab.active {
                color: white;
                background: rgba(0, 188, 212, 0.2);
                border-bottom: 2px solid #00bcd4;
            }

            .dev-content {
                flex: 1;
                overflow: hidden;
                position: relative;
            }

            .dev-tab-content {
                display: none;
                height: 100%;
                overflow-y: auto;
                padding: 15px;
            }

            .dev-tab-content.active {
                display: flex;
                flex-direction: column;
            }

            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                margin-bottom: 10px;
            }

            .chat-message {
                margin-bottom: 15px;
                padding: 10px;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.05);
            }

            .chat-message.user {
                background: rgba(0, 188, 212, 0.1);
                border-left: 3px solid #00bcd4;
            }

            .chat-message.assistant {
                background: rgba(76, 175, 80, 0.1);
                border-left: 3px solid #4CAF50;
            }

            .chat-message.error {
                background: rgba(244, 67, 54, 0.1);
                border-left: 3px solid #f44336;
            }

            .chat-message.typing {
                background: rgba(255, 193, 7, 0.1);
                border-left: 3px solid #FFC107;
                opacity: 0.8;
            }

            .chat-message.typing em {
                animation: pulse 1.5s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .chat-input-area {
                display: flex;
                gap: 10px;
            }

            .chat-input {
                flex: 1;
                min-height: 60px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #444;
                color: white;
                border-radius: 4px;
                resize: vertical;
            }

            .send-btn {
                padding: 10px 20px;
                background: #00bcd4;
                border: none;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                align-self: flex-end;
            }

            .file-browser {
                display: flex;
                gap: 15px;
                height: 100%;
            }

            .file-tree {
                width: 200px;
                background: rgba(0, 0, 0, 0.3);
                padding: 10px;
                border-radius: 8px;
                overflow-y: auto;
            }

            .file-viewer {
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .file-header {
                padding: 10px;
                background: rgba(0, 188, 212, 0.2);
                border-radius: 8px 8px 0 0;
                font-weight: bold;
            }

            .file-content {
                flex: 1;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 0 0 8px 8px;
                overflow: auto;
                margin: 0;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.5;
            }

            .console-output {
                flex: 1;
                background: rgba(0, 0, 0, 0.5);
                padding: 10px;
                border-radius: 8px;
                overflow-y: auto;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                margin-bottom: 10px;
            }

            .console-input-area {
                display: flex;
                gap: 10px;
            }

            .console-input {
                flex: 1;
                padding: 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #444;
                color: white;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
            }

            .tool-btn {
                display: block;
                width: 100%;
                padding: 10px;
                margin-bottom: 10px;
                background: rgba(0, 188, 212, 0.2);
                border: 1px solid #00bcd4;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .tool-btn:hover {
                background: rgba(0, 188, 212, 0.4);
            }

            .tool-output {
                margin-top: 20px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                max-height: 300px;
                overflow-y: auto;
            }

            /* Code Editor Styles */
            .code-editor-container {
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .editor-header {
                background: rgba(0, 0, 0, 0.4);
                padding: 10px;
                border-radius: 8px;
                margin-bottom: 10px;
            }

            .editor-file-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .editor-actions {
                display: flex;
                gap: 10px;
            }

            .editor-btn {
                padding: 5px 12px;
                background: rgba(0, 188, 212, 0.2);
                border: 1px solid #00bcd4;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s;
            }

            .editor-btn:hover {
                background: rgba(0, 188, 212, 0.4);
            }

            .ai-edit-btn {
                background: rgba(76, 175, 80, 0.2);
                border-color: #4CAF50;
                animation: pulse 2s infinite;
            }

            .ai-edit-btn:hover {
                background: rgba(76, 175, 80, 0.4);
            }

            .editor-main {
                flex: 1;
                display: flex;
                gap: 15px;
                height: calc(100% - 60px);
            }

            .editor-sidebar {
                width: 200px;
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
            }

            .quick-action-btn {
                width: 100%;
                padding: 8px;
                margin-bottom: 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                transition: all 0.3s;
            }

            .quick-action-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
            }

            .editor-status {
                margin-top: auto;
                padding-top: 15px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .status-item {
                margin-bottom: 8px;
                font-size: 11px;
            }

            .status-item strong {
                color: #00bcd4;
            }

            .editor-workspace {
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .editor-tabs {
                display: flex;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px 8px 0 0;
            }

            .editor-tab {
                flex: 1;
                padding: 10px;
                background: none;
                border: none;
                color: #888;
                cursor: pointer;
                transition: all 0.3s;
                border-bottom: 2px solid transparent;
            }

            .editor-tab.active {
                color: white;
                background: rgba(0, 188, 212, 0.2);
                border-bottom-color: #00bcd4;
            }

            .editor-content {
                flex: 1;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 0 0 8px 8px;
                position: relative;
            }

            .editor-tab-content {
                display: none;
                height: 100%;
                padding: 15px;
            }

            .editor-tab-content.active {
                display: block;
            }

            .code-textarea {
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #333;
                color: white;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.5;
                padding: 15px;
                border-radius: 4px;
                resize: none;
                outline: none;
            }

            .code-textarea:focus {
                border-color: #00bcd4;
                box-shadow: 0 0 10px rgba(0, 188, 212, 0.3);
            }

            .diff-container, .preview-container {
                height: 100%;
                overflow-y: auto;
            }

            #diffDisplay {
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
                white-space: pre-wrap;
            }

            .diff-added {
                background-color: rgba(76, 175, 80, 0.2);
                color: #4CAF50;
            }

            .diff-removed {
                background-color: rgba(244, 67, 54, 0.2);
                color: #f44336;
            }

            .diff-context {
                color: rgba(255, 255, 255, 0.7);
            }

            #previewContent {
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                border-radius: 8px;
                height: calc(100% - 40px);
                overflow-y: auto;
            }

            .state-viewer pre {
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                border-radius: 8px;
                overflow: auto;
                max-height: 400px;
            }

            code {
                background: rgba(0, 188, 212, 0.2);
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // Close button
        document.getElementById('devCloseBtn').addEventListener('click', () => {
            this.togglePanel();
        });

        // Tab switching
        document.querySelectorAll('.dev-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Save settings
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        // Chat
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('chatInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Console
        document.getElementById('executeBtn').addEventListener('click', () => {
            this.executeCode();
        });

        document.getElementById('consoleInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeCode();
            }
        });

        // Tools
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.executeTool(e.target.dataset.tool);
            });
        });

        // State refresh
        document.getElementById('refreshStateBtn')?.addEventListener('click', () => {
            this.refreshGameState();
        });

        // Code Editor Events
        document.getElementById('loadFileBtn')?.addEventListener('click', () => {
            this.loadFileToEditor();
        });

        document.getElementById('saveFileBtn')?.addEventListener('click', () => {
            this.downloadEditedFile();
        });

        document.getElementById('backupBtn')?.addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('askAIEditBtn')?.addEventListener('click', () => {
            this.askAIToEdit();
        });

        // Editor tabs
        document.querySelectorAll('.editor-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchEditorTab(e.target.dataset.editorTab);
            });
        });

        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleQuickAction(e.target.dataset.action);
            });
        });

        // Code textarea change tracking
        document.getElementById('codeTextarea')?.addEventListener('input', () => {
            this.trackCodeChanges();
        });

        // Keyboard shortcut (Ctrl+Alt+M for "Master" mode) - HIDDEN
        document.addEventListener('keydown', (e) => {
            // Log for debugging
            if (e.ctrlKey && e.altKey) {
                console.log('Ctrl+Alt pressed with key:', e.key);
            }
            
            // Check for both uppercase and lowercase M
            if (e.ctrlKey && e.altKey && (e.key === 'M' || e.key === 'm')) {
                console.log('Developer Mode shortcut triggered!');
                e.preventDefault();
                this.togglePanel();
            }
        });
    }

    togglePanel() {
        const panel = document.getElementById('developer-panel');
        
        this.isActive = !this.isActive;
        panel.classList.toggle('active');
        
        if (this.isActive) {
            this.refreshGameState();
            this.loadFileTree();
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.dev-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update content
        document.querySelectorAll('.dev-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    }

    saveSettings() {
        const provider = document.getElementById('aiProviderSelect').value;
        const apiKey = document.getElementById('apiKeyInput').value;
        
        this.aiProvider = provider;
        this.apiKey = apiKey;
        
        localStorage.setItem('devModeProvider', provider);
        if (apiKey) {
            localStorage.setItem('devModeApiKey', apiKey);
        }
        
        // Test the API connection if Gemini is selected and API key is provided
        if (provider === 'gemini' && apiKey) {
            this.testGeminiConnection();
        } else {
            this.addChatMessage('Settings saved!', 'system');
        }
    }

    async testGeminiConnection() {
        this.addChatMessage('Testing API connection...', 'system');
        
        try {
            const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: "Say 'Hello, API test successful!' and nothing else."
                        }]
                    }]
                })
            });
            
            if (testResponse.ok) {
                const data = await testResponse.json();
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    this.addChatMessage('✅ API connection successful! Your settings have been saved.', 'assistant');
                } else {
                    this.addChatMessage('⚠️ API connected but response format unexpected. Settings saved anyway.', 'system');
                }
            } else {
                const errorText = await testResponse.text();
                this.addChatMessage(`❌ API test failed (${testResponse.status}): ${testResponse.statusText}\n\nPlease check your API key. Get a free key from: https://makersuite.google.com/app/apikey`, 'error');
            }
        } catch (error) {
            this.addChatMessage(`❌ Connection test failed: ${error.message}\n\nSettings saved, but please verify your API key.`, 'error');
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addChatMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message assistant typing';
        typingDiv.innerHTML = '<strong>AI:</strong> <em>Thinking...</em>';
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Remove typing indicator
            chatMessages.removeChild(typingDiv);
            
            // Add actual response
            this.addChatMessage(response, 'assistant');
        } catch (error) {
            // Remove typing indicator
            if (chatMessages.contains(typingDiv)) {
                chatMessages.removeChild(typingDiv);
            }
            
            // Show error with fallback
            const fallbackResponse = this.getManualResponse(message);
            this.addChatMessage(`⚠️ AI Error: ${error.message}\n\n📋 Manual suggestions:\n\n${fallbackResponse}`, 'error');
        }
    }

    async getAIResponse(message) {
        if (this.aiProvider === 'none') {
            return this.getManualResponse(message);
        }
        
        if (!this.apiKey && this.aiProvider !== 'local') {
            throw new Error('Please set your API key in the settings to use AI assistance.');
        }
        
        // Prepare context
        const context = this.prepareContext();
        
        switch (this.aiProvider) {
            case 'openai':
                return await this.callOpenAI(message, context);
            case 'gemini':
                return await this.callGemini(message, context);
            case 'local':
                return await this.callLocalAI(message, context);
            default:
                return this.getManualResponse(message);
        }
    }

    prepareContext() {
        // Gather relevant context about the game
        const gameState = this.getCurrentGameState();
        
        // Get actual file contents if available
        const gameFileContent = this.fileContents.get('Game.js');
        const cardFileContent = this.fileContents.get('cards.js');
        const structureInfo = this.fileContents.get('structure');
        
        return `
You are an AI assistant for the Mystic Duel trading card game. 
You have access to the game's actual codebase and can help debug issues, suggest improvements, and explain how systems work.

=== GAME OVERVIEW ===
${structureInfo || 'Game structure loading...'}

=== CURRENT GAME STATE ===
Player Data: ${JSON.stringify(gameState.playerData, null, 2)}
Saved Decks: ${gameState.savedDecks.length} decks
Game Active: ${gameState.gameActive}
Window Size: ${gameState.windowSize.width}x${gameState.windowSize.height}

=== ACTUAL CODE ACCESS ===
${gameFileContent ? `✅ Game.js loaded (${Math.floor(gameFileContent.length/1000)}k chars)` : '❌ Game.js not loaded'}
${cardFileContent ? `✅ cards.js loaded (${Math.floor(cardFileContent.length/1000)}k chars)` : '❌ cards.js not loaded'}

${gameFileContent ? `=== KEY GAME.JS FEATURES DETECTED ===
${this.extractKeyFeatures(gameFileContent)}` : ''}

=== INSTRUCTIONS ===
The user is asking for help with their game. Provide specific, actionable advice with code examples when relevant.
You can now see the actual game implementation, so give accurate answers about how things work.
Focus on the real mechanics like deck power balancing, combat system, and card abilities.
        `;
    }

    async callOpenAI(message, context) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: context },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1500
            })
        });
        
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from OpenAI API');
        }
        
        return data.choices[0].message.content;
    }

    async callGemini(message, context) {
        // Current Google Gemini API endpoint (updated for 2024)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${context}\n\nUser: ${message}\n\nAssistant:`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                    topP: 0.8,
                    topK: 10
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Response:', errorText);
            
            // Check for common error messages and provide helpful guidance
            if (response.status === 400) {
                throw new Error(`Invalid API key or request format. Please check your API key is correct and try again.`);
            } else if (response.status === 403) {
                throw new Error(`API key doesn't have permission. Make sure you enabled the Generative AI API in Google Cloud Console.`);
            } else if (response.status === 404) {
                throw new Error(`API endpoint not found. This might be a temporary issue with Google's servers.`);
            } else {
                throw new Error(`Gemini API error (${response.status}): ${response.statusText}`);
            }
        }
        
        const data = await response.json();
        console.log('Gemini API Response:', data); // Debug log
        
        // Check for API errors in response
        if (data.error) {
            throw new Error(`Gemini API error: ${data.error.message}`);
        }
        
        // Check for blocked content
        if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
            throw new Error('Response was blocked by safety filters. Try rephrasing your question.');
        }
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
            console.error('Invalid Gemini response structure:', data);
            throw new Error('Invalid response format from Gemini API - the service might be temporarily unavailable.');
        }
        
        return data.candidates[0].content.parts[0].text;
    }

    async callLocalAI(message, context) {
        // For Ollama or other local models
        try {
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama2',
                    prompt: context + '\n\nUser: ' + message + '\n\nAssistant:',
                    stream: false
                })
            });
            
            if (!response.ok) {
                throw new Error(`Local AI error: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.response) {
                throw new Error('Invalid response format from local AI');
            }
            
            return data.response;
        } catch (error) {
            throw new Error(`Local AI not available: ${error.message}. Make sure Ollama is running on port 11434.`);
        }
    }

    getManualResponse(message) {
        // Provide helpful responses based on actual game knowledge
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('deck power') || lowerMessage.includes('ai deck') || lowerMessage.includes('balance')) {
            return `🤖 **AI Deck Balancing System** (CONFIRMED in Game.js):

✅ **How it works:**
- \`calculateDeckPower()\` sums your deck's rarity values
- Common = 1 power, Rare = 2, Epic = 3, Legendary = 4  
- \`createBalancedAIDeck()\` creates AI deck within ±5 power of yours
- AI picks better cards when it needs higher power levels

🎯 **This ensures fair matches** regardless of your collection!

**Example:** Your deck = 45 power → AI deck = 40-50 power

**To make AI stronger:** Increase the power range in \`createBalancedAIDeck()\`
**To make AI smarter:** Modify targeting logic in \`aiTurn()\` method`;
        }
        
        if (lowerMessage.includes('enrage') || lowerMessage.includes('combat')) {
            return `⚔️ **Advanced Combat System** (CONFIRMED in Game.js):

✅ **Enrage ability:** Creatures gain +2 attack when damaged
✅ **First Strike:** Deal damage before normal combat
✅ **Divine Shield:** Absorb first damage taken
✅ **Poison/Deathtouch:** Destroy any creature damaged
✅ **Complex targeting:** Rush, Flying, Taunt interactions

The game has 60+ unique abilities with sophisticated combat rules!`;
        }
        
        if (lowerMessage.includes('bug') || lowerMessage.includes('error')) {
            return `🐛 **Debugging Guide:**
1. Check browser console (F12) for error messages
2. Look at Game State tab to see current values
3. Use Console tab to test code snippets
4. **Common issues:**
   - Cards not displaying: Check \`playerData.ownedCards\`
   - Game not saving: Check localStorage in DevTools
   - Layout issues: Inspect element CSS classes
   - AI errors: Check \`createBalancedAIDeck()\` in Game.js`;
        }
        
        if (lowerMessage.includes('card') && (lowerMessage.includes('add') || lowerMessage.includes('create'))) {
            return `🎴 **Adding New Cards** (to js/data/cards.js):
\`\`\`javascript
{ 
    name: "Your Card", 
    cost: 3, 
    type: "creature", // or "spell"
    attack: 3, 
    health: 3, 
    ability: "Flying", // 60+ abilities available
    emoji: "🔥", 
    rarity: "rare" // common(1), rare(2), epic(3), legendary(4)
}
\`\`\`

**Abilities include:** Flying, Taunt, Lifesteal, Enrage, First Strike, Poison, Divine Shield, etc.`;
        }
        
        if (lowerMessage.includes('save') || lowerMessage.includes('load') || lowerMessage.includes('storage')) {
            return `💾 **Save System** (js/utils/storage.js):
- **Web version:** Uses \`localStorage\`
- **Desktop app:** Saves to %APPDATA%/mystic-duel/
- **Functions:** \`savePlayerData()\`, \`loadPlayerData()\`
- **Export saves:** Tools > Export Game Data
- **Debug saves:** Check localStorage in browser DevTools`;
        }
        
        if (lowerMessage.includes('ability') || lowerMessage.includes('mechanic')) {
            return `🧬 **60+ Card Abilities Available:**

**Combat:** Flying, First Strike, Double Strike, Trample, Reach
**Defense:** Taunt, Divine Shield, Spell Shield, Stealth  
**Effects:** Lifesteal, Regenerate, Burn, Freeze, Poison
**Triggers:** Enrage, Deathrattle, Battlecry, Resurrect
**Utility:** Draw cards, Heal, AOE damage, Silence

Each ability has complex interactions coded in Game.js!`;
        }
        
        return `🎮 **I can help with** (based on actual game code):

• 🤖 **AI Deck Balancing** - How power calculation works
• 🎴 **150+ Cards & Abilities** - Adding/modifying cards  
• ⚔️ **Complex Combat System** - Enrage, First Strike, etc.
• 💾 **Save System** - localStorage vs desktop storage
• 🐛 **Debugging** - Common issues and solutions

**Try asking:**
- "How does AI deck balancing work?"
- "What abilities are available for new cards?"
- "How does the Enrage ability work in combat?"`;
    }

    addChatMessage(message, type) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        
        // Format message with code blocks if present
        const formattedMessage = message.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'javascript'}">${this.escapeHtml(code)}</code></pre>`;
        });
        
        messageDiv.innerHTML = `<strong>${type === 'user' ? 'You' : type === 'assistant' ? 'AI' : 'System'}:</strong> ${formattedMessage}`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCurrentGameState() {
        // Get current game state
        return {
            playerData: JSON.parse(localStorage.getItem('playerData') || '{}'),
            savedDecks: JSON.parse(localStorage.getItem('savedDecks') || '[]'),
            currentDeck: window.currentDeck || [],
            gameActive: window.game ? true : false,
            windowSize: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    refreshGameState() {
        const stateDisplay = document.getElementById('gameStateDisplay');
        if (stateDisplay) {
            const state = this.getCurrentGameState();
            stateDisplay.textContent = JSON.stringify(state, null, 2);
        }
    }

    loadFileTree() {
        const fileTree = document.getElementById('fileTree');
        if (!fileTree) return;
        
        fileTree.innerHTML = `
            <div class="file-item" data-file="index.html">📄 index.html</div>
            <div class="file-folder">
                <div class="folder-name">📁 css/</div>
                <div class="file-item" data-file="css/styles.css">📄 styles.css</div>
            </div>
            <div class="file-folder">
                <div class="folder-name">📁 js/</div>
                <div class="file-item" data-file="js/game-state.js">📄 game-state.js</div>
                <div class="file-item" data-file="js/cards.js">📄 cards.js</div>
                <div class="file-item" data-file="js/deck-builder.js">📄 deck-builder.js</div>
                <div class="file-item" data-file="js/store.js">📄 store.js</div>
                <div class="file-item" data-file="js/game-logic.js">📄 game-logic.js</div>
                <div class="file-item" data-file="js/ai-opponent.js">📄 ai-opponent.js</div>
            </div>
        `;
        
        // Add click handlers
        fileTree.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                this.viewFile(item.dataset.file);
            });
        });
    }

    viewFile(filename) {
        const fileHeader = document.getElementById('fileHeader');
        const fileContent = document.getElementById('fileContent');
        
        fileHeader.textContent = filename;
        
        // Try to show actual file content if loaded
        if (this.fileContents.has(filename)) {
            fileContent.textContent = this.fileContents.get(filename);
        } else if (this.fileContents.has(filename.split('/').pop())) {
            // Try just the filename without path
            fileContent.textContent = this.fileContents.get(filename.split('/').pop());
        } else {
            // Show helpful placeholder with real structure info
            fileContent.textContent = `// ${filename}\n// Real file content loading...\n\n${this.fileContents.get('structure') || 'File structure information not available.'}`;
        }
    }

    executeCode() {
        const input = document.getElementById('consoleInput');
        const output = document.getElementById('consoleOutput');
        const code = input.value.trim();
        
        if (!code) return;
        
        // Add command to output
        const commandDiv = document.createElement('div');
        commandDiv.style.color = '#00bcd4';
        commandDiv.textContent = '> ' + code;
        output.appendChild(commandDiv);
        
        try {
            // Execute the code
            const result = eval(code);
            
            // Add result to output
            const resultDiv = document.createElement('div');
            resultDiv.style.color = '#4CAF50';
            resultDiv.textContent = '← ' + JSON.stringify(result, null, 2);
            output.appendChild(resultDiv);
        } catch (error) {
            // Add error to output
            const errorDiv = document.createElement('div');
            errorDiv.style.color = '#f44336';
            errorDiv.textContent = '✕ ' + error.message;
            output.appendChild(errorDiv);
        }
        
        input.value = '';
        output.scrollTop = output.scrollHeight;
    }

    executeTool(toolName) {
        const output = document.getElementById('toolOutput');
        
        switch (toolName) {
            case 'loadGameFile':
                this.loadGameFileToEditor(output);
                break;
            case 'testConnection':
                this.testAPIConnection(output);
                break;
            case 'generateCard':
                this.generateRandomCard(output);
                break;
            case 'testDeck':
                this.testDeckPower(output);
                break;
            case 'simulateBattle':
                this.simulateBattle(output);
                break;
            case 'validateCards':
                this.validateAllCards(output);
                break;
            case 'exportData':
                this.exportGameData(output);
                break;
            case 'clearCache':
                this.clearCache(output);
                break;
            case 'resetProgress':
                this.resetProgress(output);
                break;
        }
    }

    async loadGameFileToEditor(output) {
        const files = [
            { name: 'Game.js', path: 'js/game/Game.js', description: 'Core game logic' },
            { name: 'Card.js', path: 'js/game/Card.js', description: 'Card class definition' },
            { name: 'cards.js', path: 'js/data/cards.js', description: 'All card definitions' },
            { name: 'abilities.js', path: 'js/data/abilities.js', description: 'Ability descriptions' },
            { name: 'deckbuilder.js', path: 'js/deckbuilder/deckbuilder.js', description: 'Deck building logic' },
            { name: 'store.js', path: 'js/store/store.js', description: 'Card store system' },
            { name: 'ui.js', path: 'js/ui/ui.js', description: 'UI management' },
            { name: 'styles.css', path: 'css/styles.css', description: 'Game styling' },
            { name: 'index.html', path: 'index.html', description: 'Main game file' }
        ];
        
        let html = '<h5>📂 Select a Game File to Load:</h5>';
        
        files.forEach(file => {
            html += `
                <div style="margin: 8px 0; padding: 10px; background: rgba(0,188,212,0.1); border-radius: 5px; cursor: pointer;"
                     onclick="window.devMode.loadSpecificGameFile('${file.name}', '${file.path}')">
                    <strong>${file.name}</strong><br>
                    <small style="color: #aaa;">${file.description}</small>
                </div>
            `;
        });
        
        html += '<p><em>Click a file to load it into the Code Editor tab</em></p>';
        
        output.innerHTML = html;
    }
    
    async loadSpecificGameFile(fileName, filePath) {
        try {
            // Try to load the actual file
            let content = this.fileContents.get(fileName);
            
            if (!content) {
                // Try to fetch it
                content = await this.loadFileContent(filePath);
            }
            
            if (content) {
                this.loadContentToEditor(fileName, content);
                this.switchTab('editor');
                this.addChatMessage(`📁 Loaded ${fileName} into Code Editor`, 'system');
            } else {
                // Create a template based on the file type
                content = this.generateFileTemplate(fileName);
                this.loadContentToEditor(fileName, content);
                this.switchTab('editor');
                this.addChatMessage(`📋 Created template for ${fileName} (original not found)`, 'system');
            }
        } catch (error) {
            this.addChatMessage(`❌ Failed to load ${fileName}: ${error.message}`, 'error');
        }
    }
    
    generateFileTemplate(fileName) {
        if (fileName === 'cards.js') {
            return `// New cards for Mystic Duel
// Add your new cards to the ALL_CARDS array

export const NEW_CARDS = [
    // Example new card:
    {
        name: "Example Dragon",
        cost: 6,
        type: "creature",
        attack: 6,
        health: 6,
        ability: "Flying",
        emoji: "🐉",
        rarity: "epic"
    }
    // Add more cards here...
];

// To add these to the game:
// 1. Copy the card objects
// 2. Paste them into your main cards.js file
// 3. Make sure they're in the ALL_CARDS array`;
        }
        
        if (fileName === 'Game.js') {
            return `// Game logic modifications
// This is a template for editing Game.js

// Key methods you might want to modify:
// - calculateDeckPower(): How deck strength is calculated
// - createBalancedAIDeck(): AI deck generation
// - playCard(): Card playing logic
// - attack(): Combat system

// Example: Modify deck power calculation
/*
calculateDeckPower(deck) {
    let totalPower = 0;
    deck.forEach(card => {
        totalPower += CARD_POWER[card.rarity];
    });
    return totalPower;
}
*/`;
        }
        
        return `// Template for ${fileName}
// File content will be generated here

// You can:
// 1. Load the actual file using the Load File button
// 2. Ask AI to edit this template
// 3. Create new content from scratch

// This is a safe editing environment!`;
    }

    async testAPIConnection(output) {
        output.innerHTML = '<p>Testing API connection...</p>';
        
        if (this.aiProvider === 'none') {
            output.innerHTML = '<p>ℹ️ AI Provider set to "None" - No API to test</p>';
            return;
        }
        
        if (!this.apiKey && this.aiProvider !== 'local') {
            output.innerHTML = '<p>❌ No API key set. Please configure your API key in the settings above.</p>';
            return;
        }
        
        try {
            let testResult = '';
            
            switch (this.aiProvider) {
                case 'gemini':
                    testResult = await this.testGeminiAPI();
                    break;
                case 'openai':
                    testResult = await this.testOpenAIAPI();
                    break;
                case 'local':
                    testResult = await this.testLocalAPI();
                    break;
                default:
                    testResult = 'Unknown provider';
            }
            
            output.innerHTML = `<h5>✅ Connection Test Results:</h5><pre>${testResult}</pre>`;
        } catch (error) {
            output.innerHTML = `
                <h5>❌ Connection Test Failed:</h5>
                <p><strong>Error:</strong> ${error.message}</p>
                <h6>Troubleshooting Steps:</h6>
                <ul>
                    <li>Verify your API key is correct (should start with 'AIza' for Gemini)</li>
                    <li>Make sure you got the key from <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
                    <li>Check your internet connection</li>
                    <li>Try switching to "No AI (Manual Mode)" for built-in help</li>
                </ul>
            `;
        }
    }
    
    async testGeminiAPI() {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Say 'API Test Successful' and nothing else." }]
                }]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API returned ${response.status}: ${response.statusText}\nResponse: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]) {
            throw new Error('Invalid response structure from API');
        }
        
        return `Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`;
    }
    
    async testOpenAIAPI() {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'Say "API Test Successful" and nothing else.' }],
                max_tokens: 10
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API returned ${response.status}: ${response.statusText}\nResponse: ${errorText}`);
        }
        
        const data = await response.json();
        return `Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`;
    }
    
    async testLocalAPI() {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama2',
                prompt: 'Say "API Test Successful" and nothing else.',
                stream: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`Local AI not responding. Make sure Ollama is running on port 11434.`);
        }
        
        const data = await response.json();
        return `Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`;
    }

    generateRandomCard(output) {
        const names = ['Dragon', 'Phoenix', 'Wizard', 'Knight', 'Demon', 'Angel'];
        const abilities = ['Flying', 'Taunt', 'Lifesteal', 'Quick', 'Divine Shield'];
        const rarities = ['common', 'rare', 'epic', 'legendary'];
        
        const card = {
            name: `${names[Math.floor(Math.random() * names.length)]} Lord`,
            cost: Math.floor(Math.random() * 8) + 2,
            type: Math.random() > 0.3 ? 'creature' : 'spell',
            attack: Math.floor(Math.random() * 8) + 1,
            health: Math.floor(Math.random() * 8) + 1,
            ability: abilities[Math.floor(Math.random() * abilities.length)],
            emoji: '🔮',
            rarity: rarities[Math.floor(Math.random() * rarities.length)]
        };
        
        output.innerHTML = `
            <h5>Generated Card:</h5>
            <pre>${JSON.stringify(card, null, 2)}</pre>
            <p>Copy this to add to your cards.js file!</p>
        `;
    }

    testDeckPower(output) {
        const playerData = JSON.parse(localStorage.getItem('playerData') || '{}');
        const savedDecks = JSON.parse(localStorage.getItem('savedDecks') || '[]');
        
        let html = '<h5>Deck Power Analysis:</h5>';
        
        if (savedDecks.length === 0) {
            html += '<p>No saved decks found.</p>';
        } else {
            savedDecks.forEach(deck => {
                const power = this.calculateDeckPower(deck.cards);
                html += `<p><strong>${deck.name}:</strong> Power Level ${power}</p>`;
            });
        }
        
        output.innerHTML = html;
    }

    calculateDeckPower(cards) {
        const powerValues = { common: 1, rare: 2, epic: 3, legendary: 4 };
        return cards.reduce((total, card) => total + (powerValues[card.rarity] || 1), 0);
    }

    simulateBattle(output) {
        output.innerHTML = `
            <h5>Battle Simulation:</h5>
            <p>Player Health: 30 → 18</p>
            <p>AI Health: 30 → 12</p>
            <p>Turns: 8</p>
            <p>Winner: Player</p>
            <p><em>Feature coming soon: Full battle replay!</em></p>
        `;
    }

    validateAllCards(output) {
        const playerData = JSON.parse(localStorage.getItem('playerData') || '{}');
        const issues = [];
        
        // Check for invalid card counts
        for (const [cardName, count] of Object.entries(playerData.ownedCards || {})) {
            if (count < 0) {
                issues.push(`Negative count for ${cardName}: ${count}`);
            }
            if (count > 10) {
                issues.push(`Suspicious count for ${cardName}: ${count}`);
            }
        }
        
        output.innerHTML = `
            <h5>Card Validation:</h5>
            ${issues.length > 0 ? 
                `<p>Issues found:</p><ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul>` :
                '<p>✅ All cards validated successfully!</p>'
            }
        `;
    }

    exportGameData(output) {
        const data = {
            playerData: JSON.parse(localStorage.getItem('playerData') || '{}'),
            savedDecks: JSON.parse(localStorage.getItem('savedDecks') || '[]'),
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mystic-duel-export-${Date.now()}.json`;
        a.click();
        
        output.innerHTML = '<p>✅ Game data exported successfully!</p>';
    }

    clearCache(output) {
        if (confirm('Clear all cached data? This will not affect your saved progress.')) {
            // Clear various caches
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
            
            output.innerHTML = '<p>✅ Cache cleared!</p>';
        } else {
            output.innerHTML = '<p>Cache clear cancelled.</p>';
        }
    }

    resetProgress(output) {
        if (confirm('⚠️ Reset ALL game progress? This cannot be undone!')) {
            if (confirm('Are you REALLY sure? All cards, decks, and currency will be lost!')) {
                localStorage.removeItem('playerData');
                localStorage.removeItem('savedDecks');
                output.innerHTML = '<p>✅ Progress reset. Refresh the page to start fresh.</p>';
            } else {
                output.innerHTML = '<p>Reset cancelled.</p>';
            }
        } else {
            output.innerHTML = '<p>Reset cancelled.</p>';
        }
    }

    // Custom Modal Dialogs (Electron-compatible replacements for prompt/alert)
    showCustomAlert(message) {
        return new Promise((resolve) => {
            const modal = this.createModal('Alert', message, [
                { text: 'OK', primary: true, action: () => resolve(true) }
            ]);
            document.body.appendChild(modal);
        });
    }

    showCustomPrompt(title, message, defaultValue = '') {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = defaultValue;
            input.style.cssText = `
                width: 100%;
                padding: 10px;
                margin: 10px 0;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #00bcd4;
                color: white;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
            `;
            
            const modal = this.createModal(title, message, [
                { text: 'Cancel', primary: false, action: () => resolve(null) },
                { text: 'OK', primary: true, action: () => resolve(input.value) }
            ], input);
            
            document.body.appendChild(modal);
            
            // Focus the input
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);
            
            // Handle Enter key
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    modal.remove();
                    resolve(input.value);
                }
            });
        });
    }

    createModal(title, message, buttons, extraElement = null) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20000;
            font-family: 'Courier New', monospace;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: linear-gradient(135deg, #232526, #414345);
            border: 2px solid #00bcd4;
            border-radius: 15px;
            padding: 25px;
            max-width: 500px;
            min-width: 400px;
            box-shadow: 0 0 30px rgba(0, 188, 212, 0.5);
            color: white;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #00bcd4;">${title}</h3>
            <div style="margin-bottom: 20px; line-height: 1.5; white-space: pre-wrap;">${message}</div>
        `;
        
        if (extraElement) {
            dialog.appendChild(extraElement);
        }
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        `;
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.textContent = button.text;
            btn.style.cssText = `
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
                ${button.primary ? 
                    'background: #00bcd4; color: white;' : 
                    'background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid #666;'
                }
            `;
            
            btn.addEventListener('click', () => {
                modal.remove();
                button.action();
            });
            
            buttonContainer.appendChild(btn);
        });
        
        dialog.appendChild(buttonContainer);
        modal.appendChild(dialog);
        
        return modal;
    }
}

// Auto-initialize when imported
const devMode = new DeveloperMode();
devMode.initialize();

// Make globally available
window.devMode = devMode;
window.devModeLoaded = true;