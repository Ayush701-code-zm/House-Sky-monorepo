export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.replace(/^www\./, '');
    if (host !== 'localhost' && host !== '127.0.0.1') {
      // Production API lives on api.<domain>, never admin.<domain>
      const root = host.startsWith('admin.') ? host.slice('admin.'.length) : host;
      return `https://api.${root}/api/v1`;
    }
  }
  return 'http://localhost:5001/api/v1';
}
