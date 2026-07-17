import { vi } from "vitest";

vi.mock("vscode", () => ({
  window: {
    createOutputChannel: () => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    }),
    showInformationMessage: vi.fn(),
    showInputBox: vi.fn(),
    createWebviewPanel: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  workspace: {
    getConfiguration: () => ({
      get: vi.fn(),
      update: vi.fn(),
    }),
    onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    executeCommand: vi.fn(),
  },
  Disposable: { from: vi.fn() },
  EventEmitter: vi.fn(() => ({
    event: vi.fn(),
    fire: vi.fn(),
    dispose: vi.fn(),
  })),
  ConfigurationTarget: { Global: 1, Workspace: 2 },
  env: { machineId: "test-machine" },
}));
