<?php

namespace App\Filament\Resources\Trips\Tables;

use App\Filament\Resources\Trips\Schemas\TripForm;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class TripsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('title')
                    ->label('Judul')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => TripForm::STATUSES[$state] ?? $state)
                    ->color(fn (string $state): string => match ($state) {
                        'published' => 'success',
                        'planned' => 'info',
                        default => 'gray',
                    }),
                TextColumn::make('type')
                    ->label('Medan')
                    ->formatStateUsing(fn (string $state): string => TripForm::TYPES[$state] ?? $state),
                TextColumn::make('started_at')
                    ->label('Mulai')
                    ->date('j M Y')
                    ->placeholder('Belum diisi')
                    ->sortable(),
                TextColumn::make('distance_km')
                    ->label('Jarak')
                    ->suffix(' km')
                    ->placeholder('Belum diisi')
                    ->sortable(),
            ])
            ->defaultSort('started_at', 'desc')
            ->filters([
                SelectFilter::make('status')->label('Status')->options(TripForm::STATUSES),
                SelectFilter::make('type')->label('Medan')->options(TripForm::TYPES),
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
