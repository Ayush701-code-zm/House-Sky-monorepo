export function getApiBaseUrl(): string {
  let url = 'http://localhost:5001/api/v1';
  if (process.env.NEXT_PUBLIC_API_URL) {
    url = process.env.NEXT_PUBLIC_API_URL;
  } else if (typeof window !== 'undefined') {
    const host = window.location.hostname.replace(/^www\./, '');
    if (host !== 'localhost' && host !== '127.0.0.1') {
      // Production API lives on api.<domain>, never admin.<domain>
      const root = host.startsWith('admin.') ? host.slice('admin.'.length) : host;
      url = `https://api.${root}/api/v1`;
    }
  }
  // Keep loopback host consistent with the page origin (localhost vs 127.0.0.1)
  // so local API calls stay same-site-adjacent and match CORS entries.
  if (typeof window !== 'undefined') {
    const pageHost = window.location.hostname;
    if (pageHost === '127.0.0.1' && url.includes('://localhost')) {
      url = url.replace('://localhost', '://127.0.0.1');
    } else if (pageHost === 'localhost' && url.includes('://127.0.0.1')) {
      url = url.replace('://127.0.0.1', '://localhost');
    }
  }
  return url;
}
