import { fireEvent, render, screen } from "@testing-library/react";
import Pagination from "./Pagination";

describe("Pagination", () => {
  it("renders current range and disables previous on first page", () => {
    const onNextPage = vi.fn();
    const onPrevPage = vi.fn();

    render(
      <Pagination
        currentPage={1}
        hasNext={true}
        onNextPage={onNextPage}
        onPrevPage={onPrevPage}
        totalCount={42}
        pageSize={20}
      />,
    );

    expect(screen.getByText(/Showing/i)).toBeTruthy();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("20").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("42").length).toBeGreaterThanOrEqual(1);

    const previousButton = screen.getByRole("button", { name: /Previous/i });
    const nextButton = screen.getByRole("button", { name: /Next/i });

    expect(previousButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(false);

    fireEvent.click(nextButton);
    expect(onNextPage).toHaveBeenCalledTimes(1);
    expect(onPrevPage).not.toHaveBeenCalled();
  });

  it("disables next on last page and shows final range", () => {
    const onNextPage = vi.fn();
    const onPrevPage = vi.fn();

    render(
      <Pagination
        currentPage={3}
        hasNext={false}
        onNextPage={onNextPage}
        onPrevPage={onPrevPage}
        totalCount={42}
        pageSize={20}
      />,
    );

    expect(screen.getByText(/Showing/i)).toBeTruthy();
    expect(screen.getAllByText("41").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("42").length).toBeGreaterThanOrEqual(1);

    const nextButton = screen.getByRole("button", { name: /Next/i });
    expect(nextButton.disabled).toBe(true);

    fireEvent.click(nextButton);
    expect(onNextPage).not.toHaveBeenCalled();
  });
});
