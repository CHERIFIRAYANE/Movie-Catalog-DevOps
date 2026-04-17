import { fireEvent, render, screen } from "@testing-library/react";
import SearchBar from "./SearchBar";

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("debounces search input before calling onSearch", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Search movies...");
    fireEvent.change(input, { target: { value: "Inception" } });

    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(onSearch).toHaveBeenCalledWith("Inception");
  });

  it("clears search text and triggers an immediate clear call", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Search movies...");
    fireEvent.change(input, { target: { value: "Avatar" } });
    vi.advanceTimersByTime(500);

    const clearButton = screen.getByRole("button");
    fireEvent.click(clearButton);

    expect(onSearch).toHaveBeenLastCalledWith("");
    expect(input.value).toBe("");
  });
});
