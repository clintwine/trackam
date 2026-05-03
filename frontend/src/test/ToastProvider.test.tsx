import { render, screen } from "@testing-library/react";
import { ToastProvider } from "@/context/ToastContext";
import { useToast } from "@/hooks/useToast";

function TestToastButton() {
  const { success } = useToast();

  return (
    <button
      type="button"
      onClick={() => success("Hello world", "Test")}
    >
      Trigger toast
    </button>
  );
}

describe("ToastProvider", () => {
  it("shows a toast when triggered", async () => {
    render(
      <ToastProvider>
        <TestToastButton />
      </ToastProvider>
    );

    const button = screen.getByRole("button", { name: /trigger toast/i });
    button.click();

    expect(await screen.findByText("Test")).toBeInTheDocument();
    expect(await screen.findByText("Hello world")).toBeInTheDocument();
  });
});

