<?php

namespace App\Services;

use League\CommonMark\CommonMarkConverter;

class MarkdownService
{
    private ?CommonMarkConverter $converter = null;

    /**
     * Render markdown to HTML. Raw HTML is stripped and unsafe links (javascript:, data:) are dropped.
     */
    public function toHtml(?string $markdown): ?string
    {
        if ($markdown === null || trim($markdown) === '') {
            return null;
        }

        return trim((string) $this->converter()->convert($markdown));
    }

    private function converter(): CommonMarkConverter
    {
        return $this->converter ??= new CommonMarkConverter([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
            'max_nesting_level' => 20,
        ]);
    }
}
