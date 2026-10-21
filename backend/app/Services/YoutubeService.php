<?php

namespace App\Services;

/**
 * Extracts the video ID from YouTube links (watch, youtu.be, shorts, embed, live).
 * The public site renders videos only from this parsed ID, never from the raw URL.
 */
class YoutubeService
{
    public const INVALID_MESSAGE = 'Link YouTube tidak dikenali. Gunakan link video, contoh: https://www.youtube.com/watch?v=xxxxxxxxxxx atau https://youtu.be/xxxxxxxxxxx.';

    private const ID_PATTERN = '/^[A-Za-z0-9_-]{11}$/';

    private const HOSTS = [
        'youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com',
        'youtube-nocookie.com', 'www.youtube-nocookie.com',
    ];

    public function parseId(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }

        $url = trim($url);

        if (! preg_match('#^https?://#i', $url)) {
            $url = 'https://'.$url;
        }

        $parts = parse_url($url);

        if ($parts === false || ! isset($parts['host'])) {
            return null;
        }

        $host = strtolower($parts['host']);
        $path = $parts['path'] ?? '';
        $candidate = null;

        if ($host === 'youtu.be' || $host === 'www.youtu.be') {
            $candidate = explode('/', trim($path, '/'))[0];
        } elseif (in_array($host, self::HOSTS, true)) {
            $segments = explode('/', trim($path, '/'));

            if ($segments[0] === 'watch') {
                parse_str($parts['query'] ?? '', $query);
                $candidate = is_string($query['v'] ?? null) ? $query['v'] : null;
            } elseif (in_array($segments[0], ['shorts', 'embed', 'live', 'v'], true) && isset($segments[1])) {
                $candidate = $segments[1];
            }
        }

        if ($candidate === null || ! preg_match(self::ID_PATTERN, $candidate)) {
            return null;
        }

        return $candidate;
    }
}
