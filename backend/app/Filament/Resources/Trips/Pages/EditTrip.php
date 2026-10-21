<?php

namespace App\Filament\Resources\Trips\Pages;

use App\Filament\Resources\Trips\TripResource;
use App\Models\Trip;
use App\Services\TripService;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;

class EditTrip extends EditRecord
{
    protected static string $resource = TripResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('publish')
                ->label('Publikasikan')
                ->color('primary')
                ->visible(fn (Trip $record): bool => $record['status'] !== 'published')
                ->requiresConfirmation()
                ->modalDescription('Simpan dulu perubahan yang belum disimpan. Trip ini akan langsung tampil di situs.')
                ->action(function (Trip $record): void {
                    app(TripService::class)->publish($record->getKey());
                    $this->refreshFormData(['status']);
                    Notification::make()->title('Dipublikasikan')->success()->send();
                }),
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
