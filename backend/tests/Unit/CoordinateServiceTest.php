<?php

namespace Tests\Unit;

use App\Services\CoordinateService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class CoordinateServiceTest extends TestCase
{
    public static function validInputs(): array
    {
        return [
            'google maps copy' => ['-6.990123, 106.310456', -6.990123, 106.310456],
            'no space' => ['-6.99,106.31', -6.99, 106.31],
            'space only' => ['-7.2 109.91', -7.2, 109.91],
            'semicolon' => ['-8.03; 110.6', -8.03, 110.6],
            'parentheses and padding' => ['  (-6.75, 105.33) ', -6.75, 105.33],
            'integers' => ['-7, 110', -7.0, 110.0],
            'northern and western' => ['51.5072, -0.1276', 51.5072, -0.1276],
            'many decimals rounded' => ['-6.123456789, 106.987654321', -6.1234568, 106.9876543],
        ];
    }

    #[DataProvider('validInputs')]
    public function test_parses_valid_coordinates(string $input, float $lat, float $lng): void
    {
        $this->assertSame(['lat' => $lat, 'lng' => $lng], (new CoordinateService)->parse($input));
    }

    public static function invalidInputs(): array
    {
        return [
            'empty' => [''],
            'one number' => ['-6.99'],
            'words' => ['Dieng, Jawa Tengah'],
            'latitude out of range' => ['-96.1, 106.3'],
            'longitude out of range' => ['-6.1, 186.3'],
            'three numbers' => ['-6.1, 106.3, 12'],
            'degrees minutes seconds' => ['6°59\'24.0"S 106°18\'36.0"E'],
        ];
    }

    #[DataProvider('invalidInputs')]
    public function test_rejects_invalid_coordinates(string $input): void
    {
        $this->assertNull((new CoordinateService)->parse($input));
    }

    public function test_null_input_is_rejected(): void
    {
        $this->assertNull((new CoordinateService)->parse(null));
    }

    public function test_formats_without_trailing_zeros(): void
    {
        $service = new CoordinateService;

        $this->assertSame('-6.99, 106.31', $service->format('-6.9900000', '106.3100000'));
        $this->assertSame('-7, 110', $service->format(-7.0, 110.0));
        $this->assertNull($service->format(null, 106.31));
    }
}
