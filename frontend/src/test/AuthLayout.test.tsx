import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";

describe("AuthLayout", () => {
  it("renders title, description and children", () => {
    render(
      <MemoryRouter>
        <AuthLayout title="Log in" description="Access your account.">
          <div>Form here</div>
        </AuthLayout>
      </MemoryRouter>
    );

    expect(screen.getByText("Log in")).toBeInTheDocument();
    expect(screen.getByText("Access your account.")).toBeInTheDocument();
    expect(screen.getByText("Form here")).toBeInTheDocument();
  });
});
