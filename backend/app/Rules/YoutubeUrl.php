<?php

namespace App\Rules;

use App\Services\YoutubeService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class YoutubeUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || app(YoutubeService::class)->parseId($value) === null) {
            $fail(YoutubeService::INVALID_MESSAGE);
        }
    }
}
