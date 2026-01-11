import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'R.A.S.H College App',
        short_name: 'RASH College',
        description: 'Modern attendance tracking, student records, course management, and analytics for educational institutions',
        start_url: '/',
        display: 'standalone',
        background_color: '#002366',
        theme_color: '#002366',
        orientation: 'portrait-primary',
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/icon-192x192-maskable.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icons/icon-512x512-maskable.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        categories: ['education', 'productivity'],
    }
}
