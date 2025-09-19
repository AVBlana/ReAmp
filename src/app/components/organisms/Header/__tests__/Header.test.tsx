import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "../index";
import { NotificationProvider } from "@/app/context/NotificationContext";

// Mock the NotificationArea component
jest.mock("@/app/components/organisms/NotificationArea", () => {
  return function MockNotificationArea() {
    return <div data-testid="notification-area">Mock Notification Area</div>;
  };
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(<NotificationProvider>{component}</NotificationProvider>);
};

describe("Header", () => {
  test("should render notification area in header", () => {
    renderWithProvider(
      <Header
        title="Test Title"
        searchComponent={<div>Search Component</div>}
      />
    );

    expect(screen.getByTestId("notification-area")).toBeInTheDocument();
  });

  test("should not show greeting when userProfile is provided", () => {
    const userProfile = {
      name: "John Doe",
      email: "john@example.com",
      image: "https://example.com/image.jpg",
    };

    renderWithProvider(
      <Header
        title="Test Title"
        searchComponent={<div>Search Component</div>}
        userProfile={userProfile}
      />
    );

    // Should not show "Hello, John Doe" greeting
    expect(screen.queryByText("Hello, John Doe")).not.toBeInTheDocument();
  });

  test("should show title without greeting", () => {
    renderWithProvider(
      <Header title="ReAMP" searchComponent={<div>Search Component</div>} />
    );

    expect(screen.getByText("ReAMP")).toBeInTheDocument();
    // Should not show any greeting
    expect(screen.queryByText(/Hello,/)).not.toBeInTheDocument();
  });

  test("should render search component", () => {
    renderWithProvider(
      <Header
        title="Test Title"
        searchComponent={
          <div data-testid="search-component">Search Component</div>
        }
      />
    );

    expect(screen.getByTestId("search-component")).toBeInTheDocument();
  });
});
