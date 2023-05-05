const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const response = await res.json();
    throw new Error(
      response.error.message || 'An error occurred while fetching the data.'
    );
  }

  return res.json();
};

export default fetcher;
