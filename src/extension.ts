import * as vscode from "vscode";
import { SidebarProvider } from "./SidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "reddit-memes-sidebar",
      sidebarProvider
    )
  );
  console.log('Congratulations, your extension "reddit-memes" is now active!');

  let disposable = vscode.commands.registerCommand(
    "reddit-memes.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from reddit-memes!");
    }
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("reddit-memes.refreshWeb", async () => {
      await vscode.commands.executeCommand("workbench.action.closeSidebar");
      await vscode.commands.executeCommand(
        "workbench.view.extension.reddit-memes-sidebar-view"
      );
      // HelloWorldPanel.kill();
      //HelloWorldPanel.createOrShow(context.extensionUri);
      // setTimeout(() => {
      //   vscode.commands.executeCommand("workbench.action.webview.openDeveloperTools");
      // }, 500);
    })
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
