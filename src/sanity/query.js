export const SITE_CONTENT_QUERY = `
  *[_type == "siteContent" && _id == "siteContent"][0]{
    site,
    navigation,
    cta,
    hero,
    howItWorks,
    technology{
      ...,
      image{
        "url": asset->url,
        "dimensions": asset->metadata.dimensions,
        crop,
        hotspot
      }
    },
    testimonials{
      ...,
      items[]{
        ...,
        image{
          "url": asset->url,
          "dimensions": asset->metadata.dimensions,
          crop,
          hotspot
        }
      }
    },
    footer,
    cookieConsent,
    preOrderModal,
    notFound
  }
`
