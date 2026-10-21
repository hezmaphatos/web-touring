<?php

namespace App\Filament\Resources\GarageItems\Pages;

use App\Filament\Resources\GarageItems\GarageItemResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListGarageItems extends ListRecords
{
    protected static string $resource = GarageItemResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
