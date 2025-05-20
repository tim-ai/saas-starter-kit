
export async function toggleFavorite(listing, nitpicks, setNitpicks, userId, currentTeamId) {
  // Check if the listing is already favorited based on its realEstateId.
  const existingFavorite = nitpicks.find((fav) => fav.id === listing.id);
  console.error('Existing favorite:', existingFavorite);
  console.error('Listing:', listing);

  if (existingFavorite) {
    // Unfavorite: Trigger deletion API.
    const res = await fetch(`/api/nitpicks/${existingFavorite.nid}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      console.error('Failed to remove favorite');
      throw new Error('Failed to remove favorite');
    }
    setNitpicks((prev) =>
      prev.filter((fav) => fav.id !== existingFavorite.id)
    );
    return { status: 'removed' };
  } else {
    console.error('Adding new favorite');
    // Favorite: Create a new Nitpick record.
    const res = await fetch(`/api/nitpicks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        realEstateId: listing.id,
        userId: userId,
        teamId: currentTeamId,
      }),
    });
    if (!res.ok) {
      console.error('Failed to add favorite');
      throw new Error('Failed to add favorite');
    }
    const newFavorite = await res.json();
    const favoriteListing =  {
        ...listing,
        isFavorite: true,
        nid: newFavorite.id,
        createdAt: newFavorite.createdAt,
    }
    setNitpicks((prev) => [favoriteListing, ...prev]);
    return { status: 'added', favorite: favoriteListing };
  }
}