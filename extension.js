const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('✨ Spark Club extension is now active! 🚀');

    // 5A1DCvs1NpUG7jxOlnSG285D8nbqUq7WuD3OIfAkKlqLVTNB99DnJQQJ99ALACAAAAAAAAAAAAASAZDOmYe3
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
                        progress.report({ increment: 100, message: '🎉 Workspace is ready!' });

                        const welcomeFilePath = path.join(userFolder, "WELCOME.md");
                        if (!fs.existsSync(welcomeFilePath)) {
                            const welcomeContent = `# 🌟 Welcome to your workspace, ${name}!\n\nThis is your personalized workspace. Feel free to create notes and manage your tasks.\n\n- 📄 Start by creating a new note using the command palette.\n- ✅ Stay organized with Task Lists.\n\nEnjoy your productivity journey! 🚀`;
                            fs.writeFileSync(welcomeFilePath, welcomeContent);
                        }
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
            ['📄 Blank Note', '📝 Meeting Notes', '✅ Task List'],
            {
                placeHolder: '🖋 Choose a note template to get started.',
                canPickMany: false,
            }
        );

        if (!noteTemplate) {
            vscode.window.showWarningMessage('⚠️ No template selected. Please try again.');
            return;
        }

        let content = `# 📝 Hello, ${userName}!\n---\nStart writing your note below:\n`;
        if (noteTemplate === '📝 Meeting Notes') {
            content += `\n## 🗓 Meeting Details\n- **Meeting Date:** \n- **Attendees:** \n- **Agenda:**\n  - \n\n### 📋 Notes\n- `;
        } else if (noteTemplate === '✅ Task List') {
            content += `\n## ✅ Tasks\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3`;
        }

        const doc = await vscode.workspace.openTextDocument({ content });
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(`🎉 Your new ${noteTemplate} is ready!`);
    });

    // Listen for file saves
    const fileSaveWatcher = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.fileName.endsWith('.txt')) {
            vscode.window.showInformationMessage('💾 File saved successfully!');
        }
    });

    context.subscriptions.push(addNameCommand, createNoteCommand, fileSaveWatcher);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
};
