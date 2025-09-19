import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "../index";
import { NotificationProvider } from "@/app/context/NotificationContext";

// Mock the UserAvatar component
jest.mock("@/app/components/molecules/UserAvatar", () => {
  return function MockUserAvatar() {
    return <div data-testid="user-avatar">Mock User Avatar</div>;
  };
});

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({ href, children, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(<NotificationProvider>{component}</NotificationProvider>);
};

describe("Header Navigation", () => {
  test("should have Home button that navigates to landing page", () => {
    renderWithProvider(
      <Header
        title="Test Title"
        searchComponent={<div>Search Component</div>}
      />
    );

    // Check for Home button in mobile view
    const mobileHomeLink = screen.getByLabelText("Home");
    expect(mobileHomeLink).toHaveAttribute("href", "/");

    // Check for Home button in desktop view
    const desktopHomeLink = screen.getByLabelText("Home");
    expect(desktopHomeLink).toHaveAttribute("href", "/");
  });

  test("should render user avatar component", () => {
    renderWithProvider(
      <Header
        title="Test Title"
        searchComponent={<div>Search Component</div>}
      />
    );

    expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
  });

  test("should show logout button when showLogout is true", () => {
    const mockOnLogout = jest.fn();

    renderWithProvider(
      <Header
        title="Test Title"
        searchComponent={<div>Search Component</div>}
        showLogout={true}
        onLogout={mockOnLogout}
      />
    );

    const logoutButton = screen.getByText("Logout");
    expect(logoutButton).toBeInTheDocument();

    fireEvent.click(logoutButton);
    expect(mockOnLogout).toHaveBeenCalled();
  });

  test("should not show logout button when showLogout is false", () => {
    renderWithProvider(
      <Header
        title="Test Title"
        searchComponent={<div>Search Component</div>}
        showLogout={false}
      />
    );

    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  test("should render search component in center section", () => {
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

  test("should have proper responsive layout classes", () => {
    renderWithProvider(
      <Header
        title="Test Title"
        searchComponent={<div>Search Component</div>}
      />
    );

    // Check for responsive layout classes
    const header = screen.getByRole("banner");
    expect(header).toHaveClass(
      "bg-black/80",
      "border-b",
      "border-white/10",
      "sticky",
      "top-0",
      "z-50"
    );
  });

  test("should display title correctly", () => {
    renderWithProvider(
      <Header title="ReAMP" searchComponent={<div>Search Component</div>} />
    );

    expect(screen.getByText("ReAMP")).toBeInTheDocument();
  });

  test("should have proper accessibility attributes", () => {
    renderWithProvider(
      <Header
        title="Test Title"
        searchComponent={<div>Search Component</div>}
      />
    );

    // Check for proper ARIA labels
    const homeLinks = screen.getAllByLabelText("Home");
    expect(homeLinks).toHaveLength(2); // Mobile and desktop versions

    // Check for proper heading structure
    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent("Test Title");
  });
});
