import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FavoriteButton from "./FavoriteButton";

describe("FavoriteButton", () => {
  it("calls onFavorite when movie is not favorited", async () => {
    const onFavorite = vi.fn().mockResolvedValue(undefined);
    const onUnfavorite = vi.fn().mockResolvedValue(undefined);

    render(
      <FavoriteButton
        movieId={101}
        isFavorited={false}
        onFavorite={onFavorite}
        onUnfavorite={onUnfavorite}
      />,
    );

    const button = screen.getByRole("button", { name: /Add to favorites/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onFavorite).toHaveBeenCalledWith(101);
    });

    expect(onUnfavorite).not.toHaveBeenCalled();
  });

  it("calls onUnfavorite when movie is already favorited", async () => {
    const onFavorite = vi.fn().mockResolvedValue(undefined);
    const onUnfavorite = vi.fn().mockResolvedValue(undefined);

    render(
      <FavoriteButton
        movieId={202}
        isFavorited={true}
        onFavorite={onFavorite}
        onUnfavorite={onUnfavorite}
      />,
    );

    const button = screen.getByRole("button", {
      name: /Remove from favorites/i,
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onUnfavorite).toHaveBeenCalledWith(202);
    });

    expect(onFavorite).not.toHaveBeenCalled();
  });
});
