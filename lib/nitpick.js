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
    lotSize: record.lotSize,
    history: record.propertyHistory,
    year_built: record.yearBuilt,
    url: record.listingUrl,
    image: record.images && record.images.length > 0 ? record.images[0] : null,
    description: record.description,
    _geo: record.geo,
    town: record.town,
    status: record.status,
    country: record.country,
    zipcode: record.postalCode,
    createdAt: record.createdAt,
    extraInfo: record.extraInfo,
    issues: record.issues || []
  };
}

export function transformStatus(status) {
    if (status === 'Active' || (status && status.startsWith('FOR SALE'))) return 'Active';
    if (status === 'Pending' || status === 'CONTINGENT' || status === 'ACTIVE WITH CONTRACT') return 'Pending';
    if (status === 'Sold' || status === 'Off Market') return 'Sold';
    return status || 'Unknown';
}