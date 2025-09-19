import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserAvatar from "../UserAvatar";
import { useAuth } from "@/app/context/AuthContext";
import { useNotifications } from "@/app/context/NotificationContext";

// Mock the auth context
jest.mock("@/app/context/AuthContext");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the notifications context
jest.mock("@/app/context/NotificationContext");
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

// Mock the useOutsideClick hook
jest.mock("@/app/hooks", () => ({
  useOutsideClick: jest.fn(),
}));

describe("UserAvatar", () => {
  const mockRemoveNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    } as any);

    mockUseNotifications.mockReturnValue({
      notifications: [],
      removeNotification: mockRemoveNotification,
    } as any);

    const { container } = render(<UserAvatar />);
    expect(container.firstChild).toBeNull();
  });

  it("should render user avatar when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "John Doe", image: "https://example.com/avatar.jpg" },
    } as any);

    mockUseNotifications.mockReturnValue({
      notifications: [],
      removeNotification: mockRemoveNotification,
    } as any);

    render(<UserAvatar />);
    
    expect(screen.getByRole("button", { name: "User notifications" })).toBeInTheDocument();
    expect(screen.getByAltText("John Doe")).toBeInTheDocument();
  });

  it("should show notification count badge when notifications exist", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "John Doe" },
    } as any);

    mockUseNotifications.mockReturnValue({
      notifications: [
        { id: "1", type: "warning", message: "Test notification", duration: 0 },
        { id: "2", type: "info", message: "Another notification", duration: 5000 },
      ],
      removeNotification: mockRemoveNotification,
    } as any);

    render(<UserAvatar />);
    
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should show 9+ when more than 9 notifications", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "John Doe" },
    } as any);

    const manyNotifications = Array.from({ length: 12 }, (_, i) => ({
      id: i.toString(),
      type: "info" as const,
      message: `Notification ${i}`,
      duration: 5000,
    }));

    mockUseNotifications.mockReturnValue({
      notifications: manyNotifications,
      removeNotification: mockRemoveNotification,
    } as any);

    render(<UserAvatar />);
    
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("should toggle dropdown when avatar is clicked", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "John Doe" },
    } as any);

    mockUseNotifications.mockReturnValue({
      notifications: [
        { id: "1", type: "warning", message: "Test notification", duration: 0 },
      ],
      removeNotification: mockRemoveNotification,
    } as any);

    render(<UserAvatar />);
    
    const avatarButton = screen.getByRole("button", { name: "User notifications" });
    
    // Initially dropdown should not be visible
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
    
    // Click to open dropdown
    fireEvent.click(avatarButton);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    
    // Click again to close dropdown
    fireEvent.click(avatarButton);
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });

  it("should show no notifications message when no notifications exist", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "John Doe" },
    } as any);

    mockUseNotifications.mockReturnValue({
      notifications: [],
      removeNotification: mockRemoveNotification,
    } as any);

    render(<UserAvatar />);
    
    const avatarButton = screen.getByRole("button", { name: "User notifications" });
    fireEvent.click(avatarButton);
    
    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });

  it("should categorize notifications correctly", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "John Doe" },
    } as any);

    mockUseNotifications.mockReturnValue({
      notifications: [
        { id: "1", type: "warning", message: "Spotify not connected", duration: 0 },
        { id: "2", type: "info", message: "Search completed", duration: 5000 },
      ],
      removeNotification: mockRemoveNotification,
    } as any);

    render(<UserAvatar />);
    
    const avatarButton = screen.getByRole("button", { name: "User notifications" });
    fireEvent.click(avatarButton);
    
    expect(screen.getByText("Service Status")).toBeInTheDocument();
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText("Spotify not connected")).toBeInTheDocument();
    expect(screen.getByText("Search completed")).toBeInTheDocument();
  });

  it("should close dropdown on escape key", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "John Doe" },
    } as any);

    mockUseNotifications.mockReturnValue({
      notifications: [
        { id: "1", type: "warning", message: "Test notification", duration: 0 },
      ],
      removeNotification: mockRemoveNotification,
    } as any);

    render(<UserAvatar />);
    
    const avatarButton = screen.getByRole("button", { name: "User notifications" });
    fireEvent.click(avatarButton);
    
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    
    // Press escape key
    fireEvent.keyDown(document, { key: "Escape" });
    
    await waitFor(() => {
      expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
    });
  });
});
