export const publicEnv = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/v1",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  mapStyleUrl:
    process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/liberty",
  defaultMapLat: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_LAT || -6.5971469),
  defaultMapLng: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_LNG || 106.8060388),
  defaultMapZoom: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM || 13),
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  turnstileSiteKey:
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",
};
