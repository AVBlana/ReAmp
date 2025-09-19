import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

describe("No /signin Redirects Remaining", () => {
  it('should not contain any router.push("/signin") calls', () => {
    const searchCommand =
      'grep -r "router\\.push.*signin" src/ --include="*.ts" --include="*.tsx" || true';
    const result = execSync(searchCommand, { encoding: "utf8" });

    // Should be empty or only contain test files
    const lines = result
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const nonTestLines = lines.filter(
      (line) => !line.includes("__tests__") && !line.includes(".test.")
    );

    expect(nonTestLines).toHaveLength(0);
  });

  it('should not contain any window.location.href = "/signin" calls', () => {
    const searchCommand =
      'grep -r "window\\.location\\.href.*signin" src/ --include="*.ts" --include="*.tsx" || true';
    const result = execSync(searchCommand, { encoding: "utf8" });

    // Should be empty or only contain test files
    const lines = result
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const nonTestLines = lines.filter(
      (line) => !line.includes("__tests__") && !line.includes(".test.")
    );

    expect(nonTestLines).toHaveLength(0);
  });

  it('should not contain any redirect("/signin") calls', () => {
    const searchCommand =
      'grep -r "redirect.*signin" src/ --include="*.ts" --include="*.tsx" || true';
    const result = execSync(searchCommand, { encoding: "utf8" });

    // Should be empty or only contain test files
    const lines = result
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const nonTestLines = lines.filter(
      (line) => !line.includes("__tests__") && !line.includes(".test.")
    );

    expect(nonTestLines).toHaveLength(0);
  });

  it("should have NextAuth configured to use landing page as sign-in page", () => {
    const authConfigPath = join(process.cwd(), "src/lib/auth.ts");
    const authConfig = readFileSync(authConfigPath, "utf8");

    expect(authConfig).toContain('signIn: "/"');
    expect(authConfig).not.toContain('signIn: "/signin"');
  });

  it("should have signin page redirect to landing", () => {
    const signinPagePath = join(process.cwd(), "src/app/signin/page.tsx");
    const signinPage = readFileSync(signinPagePath, "utf8");

    expect(signinPage).toContain("redirect('/')");
    expect(signinPage).not.toContain("signIn");
    expect(signinPage).not.toContain("useAuth");
  });
});
