<?php

namespace App\Filament\Resources\GarageItems\Tables;

use App\Models\GarageItem;
use App\Services\RevalidationService;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class GarageItemsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->reorderable('position')
            // Reordering is a bulk update without model events, so revalidate here.
            ->afterReordering(fn () => app(RevalidationService::class)->modelChanged(GarageItem::class))
            ->defaultSort('position')
            ->columns([
                TextColumn::make('name')
                    ->label('Nama part')
                    ->searchable(),
                TextColumn::make('category')
                    ->label('Kategori'),
                TextColumn::make('installed_at')
                    ->label('Dipasang')
                    ->date('j M Y')
                    ->placeholder('Belum diisi'),
                TextColumn::make('hotspot_x')
                    ->label('Titik di foto')
                    ->formatStateUsing(fn ($state, $record): string => $state === null ? '' : $record['hotspot_x'].', '.$record['hotspot_y'])
                    ->placeholder('Hanya di tabel'),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
