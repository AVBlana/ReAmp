import { redirect } from "next/navigation";
import SigninPage from "../page";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe("SigninPage Redirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to landing page when accessed", () => {
    SigninPage();

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("does not render any UI content", () => {
    // Since it's a server component that redirects, it shouldn't render anything
    const result = SigninPage();
    expect(result).toBeUndefined();
  });
});
