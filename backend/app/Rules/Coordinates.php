<?php

namespace App\Rules;

use App\Services\CoordinateService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Coordinates implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || app(CoordinateService::class)->parse($value) === null) {
            $fail(CoordinateService::INVALID_MESSAGE);
        }
    }
}
