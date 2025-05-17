export function transformNitpick(record) {
  return {
    id: record.id,
    nid: record.nid, // nitpick id
    address: record.address,
    price: record.price,
    beds: record.bedrooms,
    baths: record.bathrooms,
    sqft: record.area,
    garage: record.garage,
    year_built: record.yearBuilt,
    url: record.listingUrl,
    image: record.images && record.images.length > 0 ? record.images[0] : null,
    description: record.description,
    _geo: record.geo,
    town: record.town,
    state: record.state,
    country: record.country,
    zipcode: record.postalCode,
    createdAt: record.createdAt,
  };
}