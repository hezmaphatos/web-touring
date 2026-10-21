<?php

namespace App\Filament\Resources\GarageItems;

use App\Filament\Resources\GarageItems\Pages\CreateGarageItem;
use App\Filament\Resources\GarageItems\Pages\EditGarageItem;
use App\Filament\Resources\GarageItems\Pages\ListGarageItems;
use App\Filament\Resources\GarageItems\Schemas\GarageItemForm;
use App\Filament\Resources\GarageItems\Tables\GarageItemsTable;
use App\Models\GarageItem;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class GarageItemResource extends Resource
{
    protected static ?string $model = GarageItem::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedWrench;

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?string $modelLabel = 'modifikasi';

    protected static ?string $pluralModelLabel = 'garage';

    protected static ?string $navigationLabel = 'Garage';

    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return GarageItemForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return GarageItemsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListGarageItems::route('/'),
            'create' => CreateGarageItem::route('/create'),
            'edit' => EditGarageItem::route('/{record}/edit'),
        ];
    }
}
