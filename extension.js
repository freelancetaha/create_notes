const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('✨ Mind Notes extension is now active! 🚀');

    // Command to ask for the user's name
    const addNameCommand = vscode.commands.registerCommand('notes.addName', async function () {
        const name = await vscode.window.showInputBox({
            placeHolder: "👤 Enter your name (e.g., JohnDoe)",
            prompt: "🌟 Personalize your workspace with your name.",
            validateInput: (input) => {
                if (!input.trim()) return '⚠️ Name cannot be empty!';
                if (input.length > 20) return '⚠️ Name must be under 20 characters.';
                return null;
            }
        });

        if (name) {
            context.globalState.update('userName', name);

            const workspaceFolder = vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders[0].uri.fsPath
                : '';

            if (workspaceFolder) {
                const userFolder = path.join(workspaceFolder, name);

                await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: `🎨 Setting up your workspace, ${name}...`,
                        cancellable: false,
                    },
                    async (progress) => {
                        progress.report({ increment: 0, message: '📁 Creating folder...' });
                        if (!fs.existsSync(userFolder)) {
                            fs.mkdirSync(userFolder, { recursive: true });
                        }

                        progress.report({ increment: 50, message: '✨ Opening workspace...' });
                        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(userFolder));

                        const welcomeFilePath = path.join(userFolder, "WELCOME.md");
                        if (!fs.existsSync(welcomeFilePath)) {
                            const welcomeContent = `# 🌟 Welcome to your workspace, ${name}!

This is your personalized workspace. Feel free to create notes and manage your tasks.

- 📄 Start by creating a new note using the command palette.
- ✅ Stay organized with Task Lists.
- 💡 Explore new templates for Bug Tracking and Code Snippets.

Enjoy your productivity journey! 🚀`;
                            fs.writeFileSync(welcomeFilePath, welcomeContent);
                        }

                        progress.report({ increment: 100, message: '🎉 Workspace is ready!' });
                    }
                );

                vscode.window.showInformationMessage(
                    `🎉 Welcome, ${name}! Your workspace has been created and opened.`,
                    "Open Welcome Note"
                ).then((selection) => {
                    if (selection === "Open Welcome Note") {
                        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(path.join(userFolder, "WELCOME.md")));
                    }
                });
            } else {
                vscode.window.showErrorMessage("❌ Please open a folder in VS Code before using this command.");
            }
        } else {
            vscode.window.showWarningMessage("⚠️ You didn't enter a name. Please try again.");
        }
    });

    // Command to create a new note
    const createNoteCommand = vscode.commands.registerCommand('notes.createNote', async function () {
        const userName = context.globalState.get('userName');

        if (!userName) {
            vscode.window.showInformationMessage(
                "❗ Please set your name first using the 'Add Your Name' command."
            );
            return;
        }

        const noteTemplate = await vscode.window.showQuickPick(
            ['📄 Blank Note', '📝 Meeting Notes', '✅ Task List', '📅 Project Plan', '📖 Daily Journal', '🐞 Bug Tracker', '💻 Code Snippet Manager'],
            {
                placeHolder: '🖋 Choose a note template to get started.',
                canPickMany: false,
            }
        );

        if (!noteTemplate) {
            vscode.window.showWarningMessage('⚠️ No template selected. Please try again.');
            return;
        }

        let content = `# 📝 Hello, ${userName}!
---
Start writing your note below:
`;
        if (noteTemplate === '📝 Meeting Notes') {
            content += `\n## 🗓 Meeting Details\n- **Meeting Date:** \n- **Attendees:** \n- **Agenda:**\n  - \n\n### 📋 Notes\n- `;
        } else if (noteTemplate === '✅ Task List') {
            content += `\n## ✅ Tasks\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3`;
        } else if (noteTemplate === '📅 Project Plan') {
            content += `\n## 📅 Milestones\n- [ ] Milestone 1\n- [ ] Milestone 2\n- [ ] Milestone 3\n\n### 📊 Project Overview\n- `;
        } else if (noteTemplate === '📖 Daily Journal') {
            content += `\n## 📅 Date: \n### 📝 Thoughts\n- \n\n### 🎯 Goals for the Day\n- `;
        } else if (noteTemplate === '🐞 Bug Tracker') {
            content += `\n## 🐞 Bug Details\n- **Issue ID:** \n- **Description:** \n- **Priority:** \n\n### 🔧 Steps to Reproduce\n1. \n2. \n\n### ✅ Resolution Notes\n- `;
        } else if (noteTemplate === '💻 Code Snippet Manager') {
            content += `\n## 🖥 Code Snippet\n\`\`\`javascript\n// Your snippet here\n\`\`\`\n\n### 📜 Description\n- `;
        }

        const doc = await vscode.workspace.openTextDocument({ content });
        await vscode.window.showTextDocument(doc);

        // Automatically open Markdown preview
        vscode.commands.executeCommand('markdown.showPreviewToSide');

        vscode.window.showInformationMessage(`🎉 Your new ${noteTemplate} is ready!`);
    });

    // Command to save custom templates
    const saveTemplateCommand = vscode.commands.registerCommand('notes.saveTemplate', async function () {
        const templateName = await vscode.window.showInputBox({
            placeHolder: "Enter a name for your template",
            prompt: "Save your custom note template for future use."
        });

        if (templateName) {
            const content = await vscode.window.activeTextEditor?.document.getText();
            if (content) {
                const templatePath = path.join(context.globalStorageUri.fsPath, `${templateName}.md`);
                fs.writeFileSync(templatePath, content);
                vscode.window.showInformationMessage(`✅ Template '${templateName}' saved successfully.`);
            } else {
                vscode.window.showWarningMessage('⚠️ No active content to save as a template.');
            }
        }
    });

    // File save notification
    const fileSaveWatcher = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.fileName.endsWith('.txt') || document.fileName.endsWith('.md')) {
            vscode.window.showInformationMessage('💾 File saved successfully!');
        }
    });

    context.subscriptions.push(addNameCommand, createNoteCommand, saveTemplateCommand, fileSaveWatcher);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
};
