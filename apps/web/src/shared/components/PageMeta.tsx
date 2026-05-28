const SITE = 'ManageCost';
const BASE_URL = 'https://gastos.santiagomustafa.com.ar';

interface PageMetaProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  noindex?: boolean;
}

/**
 * Usa el soporte nativo de React 19 para inyectar <title> y <meta> en el <head>.
 * No requiere librerías externas como react-helmet.
 */
export function PageMeta({ title, description, canonicalPath, noindex = false }: PageMetaProps) {
  const fullTitle = `${title} — ${SITE}`;
  const canonical = canonicalPath ? `${BASE_URL}${canonicalPath}` : undefined;

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      {canonical && <meta property="og:url" content={canonical} />}
    </>
  );
}
