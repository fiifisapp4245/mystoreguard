export interface Testimonial {
  quote: string
  name: string
  shop: string
  location: string
}

/**
 * Ship empty. The home page's social-proof section only renders when this
 * has entries — no placeholder quotes, no fake logos.
 */
export const testimonials: Testimonial[] = []
