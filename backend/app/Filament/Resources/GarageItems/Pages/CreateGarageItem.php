<?php

namespace App\Filament\Resources\GarageItems\Pages;

use App\Filament\Resources\GarageItems\GarageItemResource;
use Filament\Actions\Action;
use Filament\Resources\Pages\CreateRecord;

class CreateGarageItem extends CreateRecord
{
    protected static string $resource = GarageItemResource::class;

    protected static bool $canCreateAnother = false;

    protected function getCreateFormAction(): Action
    {
        return parent::getCreateFormAction()->label('Simpan');
    }

    protected function getCreatedNotificationTitle(): ?string
    {
        return 'Tersimpan';
    }
}
