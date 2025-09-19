import React from "react";
import { render, screen, act } from "@testing-library/react";
import { NotificationProvider, useNotifications } from "../NotificationContext";

// Test component that uses the notification context
const TestComponent = () => {
  const { notifications, addNotification, removeNotification } =
    useNotifications();

  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      <button
        onClick={() =>
          addNotification({
            type: "warning",
            message: "Test notification",
            duration: 0,
          })
        }
        data-testid="add-notification"
      >
        Add Notification
      </button>
      <button
        onClick={() =>
          addNotification({
            type: "warning",
            message: "Test notification", // Same message to test deduplication
            duration: 0,
          })
        }
        data-testid="add-duplicate"
      >
        Add Duplicate
      </button>
      <button
        onClick={() => removeNotification(notifications[0]?.id)}
        data-testid="remove-notification"
      >
        Remove Notification
      </button>
      <div data-testid="notifications">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            data-testid={`notification-${notification.id}`}
          >
            {notification.message}
          </div>
        ))}
      </div>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(<NotificationProvider>{component}</NotificationProvider>);
};

describe("NotificationContext", () => {
  test("should add notification", () => {
    renderWithProvider(<TestComponent />);

    const addButton = screen.getByTestId("add-notification");
    const countElement = screen.getByTestId("notification-count");

    expect(countElement).toHaveTextContent("0");

    act(() => {
      addButton.click();
    });

    expect(countElement).toHaveTextContent("1");
    expect(screen.getByText("Test notification")).toBeInTheDocument();
  });

  test("should prevent duplicate notifications", () => {
    renderWithProvider(<TestComponent />);

    const addButton = screen.getByTestId("add-notification");
    const addDuplicateButton = screen.getByTestId("add-duplicate");
    const countElement = screen.getByTestId("notification-count");

    // Add first notification
    act(() => {
      addButton.click();
    });

    expect(countElement).toHaveTextContent("1");

    // Try to add duplicate
    act(() => {
      addDuplicateButton.click();
    });

    // Should still be 1, not 2
    expect(countElement).toHaveTextContent("1");
  });

  test("should remove notification", () => {
    renderWithProvider(<TestComponent />);

    const addButton = screen.getByTestId("add-notification");
    const removeButton = screen.getByTestId("remove-notification");
    const countElement = screen.getByTestId("notification-count");

    // Add notification
    act(() => {
      addButton.click();
    });

    expect(countElement).toHaveTextContent("1");

    // Remove notification
    act(() => {
      removeButton.click();
    });

    expect(countElement).toHaveTextContent("0");
    expect(screen.queryByText("Test notification")).not.toBeInTheDocument();
  });

  test("should auto-remove notification after duration", async () => {
    jest.useFakeTimers();

    renderWithProvider(<TestComponent />);

    const addButton = screen.getByTestId("add-notification");
    const countElement = screen.getByTestId("notification-count");

    // Add notification with 1000ms duration
    act(() => {
      addButton.click();
    });

    expect(countElement).toHaveTextContent("1");

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(countElement).toHaveTextContent("0");

    jest.useRealTimers();
  });
});
