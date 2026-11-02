<?php

return [

    'site_name' => env('SITE_NAME', 'Logbook'),

    'admin_email' => env('ADMIN_EMAIL'),

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

    'revalidate_url' => env('FRONTEND_REVALIDATE_URL'),

    'revalidate_secret' => env('REVALIDATE_SECRET'),

    // Generate AVIF variants next to WebP when GD supports it.
    'avif' => (bool) env('MEDIA_AVIF', true),

    // Longest side of stored originals in px; 0 keeps uploads as they are. Saves disk on small hosts.
    'original_max_size' => (int) env('ORIGINAL_MAX_SIZE', 0),

];
