<?php

namespace Tests\Unit;

use App\Services\YoutubeService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class YoutubeServiceTest extends TestCase
{
    public static function validUrls(): array
    {
        return [
            'watch' => ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
            'watch with extra params' => ['https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=42s'],
            'mobile watch' => ['https://m.youtube.com/watch?v=dQw4w9WgXcQ'],
            'no scheme' => ['youtube.com/watch?v=dQw4w9WgXcQ'],
            'short link' => ['https://youtu.be/dQw4w9WgXcQ'],
            'short link with share param' => ['https://youtu.be/dQw4w9WgXcQ?si=abc123'],
            'shorts' => ['https://www.youtube.com/shorts/dQw4w9WgXcQ'],
            'embed' => ['https://www.youtube.com/embed/dQw4w9WgXcQ'],
            'nocookie embed' => ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
            'live' => ['https://www.youtube.com/live/dQw4w9WgXcQ?feature=share'],
            'surrounding whitespace' => ['  https://youtu.be/dQw4w9WgXcQ  '],
        ];
    }

    #[DataProvider('validUrls')]
    public function test_parses_the_video_id(string $url): void
    {
        $this->assertSame('dQw4w9WgXcQ', (new YoutubeService)->parseId($url));
    }

    public static function invalidUrls(): array
    {
        return [
            'empty' => [''],
            'not a url' => ['video perjalanan'],
            'other host' => ['https://vimeo.com/123456'],
            'lookalike host' => ['https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ'],
            'channel page' => ['https://www.youtube.com/@someone'],
            'playlist only' => ['https://www.youtube.com/playlist?list=PL1234567890'],
            'id too short' => ['https://youtu.be/abc'],
            'id with bad characters' => ['https://www.youtube.com/watch?v=dQw4w9W<cQ'],
            'script scheme' => ['javascript:alert(1)'],
        ];
    }

    #[DataProvider('invalidUrls')]
    public function test_rejects_invalid_urls(string $url): void
    {
        $this->assertNull((new YoutubeService)->parseId($url));
    }
}
