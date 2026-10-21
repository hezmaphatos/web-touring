<?php

namespace App\Filament\Resources\GarageItems\Pages;

use App\Filament\Resources\GarageItems\GarageItemResource;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditGarageItem extends EditRecord
{
    protected static string $resource = GarageItemResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make()->successNotificationTitle('Dihapus'),
        ];
    }

    protected function getSaveFormAction(): Action
    {
        return parent::getSaveFormAction()->label('Simpan');
    }

    protected function getSavedNotificationTitle(): ?string
    {
        return 'Tersimpan';
    }
}
