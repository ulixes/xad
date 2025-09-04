// Main exports for authentication module

// Containers
export { AuthContainer } from "./containers/AuthContainer";

// Components
export { AuthView } from "./components/AuthView";
export { LoginButton } from "./components/LoginButton";
export { LogoutButton } from "./components/LogoutButton";
export { UserProfile } from "./components/UserProfile";
export { WalletDisplay } from "./components/WalletDisplay";
export { AuthStatusIndicator } from "./components/AuthStatusIndicator";

// Hooks
export { useAuth } from "./hooks/useAuth";
export { useClipboard } from "./hooks/useClipboard";

// Services
export { AuthenticationService } from "./services/AuthenticationService";
export { WindowService } from "./services/WindowService";
export { ClipboardService } from "./services/ClipboardService";

// Types
export type {
  AuthUser,
  AuthWallet,
  AuthCredentials,
  AuthenticationState,
  AuthenticationStatus,
  AuthWindowConfig,
  ClipboardState,
  AuthServiceInterface,
  WindowServiceInterface,
  ClipboardServiceInterface,
} from "./types/auth.types";

export { AuthErrorCode, AuthenticationError } from "./types/auth.types";

// Utils
export * from "./utils/formatters";
export * from "./utils/validators";

// Error Boundary
export { AuthErrorBoundary } from "./errors/AuthErrorBoundary";
