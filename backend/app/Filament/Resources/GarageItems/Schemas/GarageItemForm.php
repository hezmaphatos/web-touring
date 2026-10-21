<?php

namespace App\Filament\Resources\GarageItems\Schemas;

use App\Services\MediaService;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\MarkdownEditor;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class GarageItemForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(1)
            ->components([
                Section::make('Modifikasi')
                    ->columns(2)
                    ->schema([
                        TextInput::make('name')
                            ->label('Nama part')
                            ->required()
                            ->maxLength(255),
                        TextInput::make('category')
                            ->label('Kategori')
                            ->placeholder('Kaki-kaki, kelistrikan, bagasi ...')
                            ->required()
                            ->maxLength(255),
                        DatePicker::make('installed_at')
                            ->label('Tanggal pasang')
                            ->native(false)
                            ->displayFormat('j M Y')
                            ->closeOnDateSelection(),
                        MarkdownEditor::make('description')
                            ->label('Catatan (merek, alasan, kesan)')
                            ->columnSpanFull(),
                        SpatieMediaLibraryFileUpload::make('photo')
                            ->label('Foto (opsional)')
                            ->collection('photo')
                            ->conversion('webp-480')
                            ->image()
                            ->acceptedFileTypes(MediaService::MIME_TYPES)
                            ->maxSize(MediaService::MAX_UPLOAD_KB)
                            ->columnSpanFull(),
                    ]),
                Section::make('Titik di foto motor')
                    ->description('Posisi kotak kuning di foto motor (halaman Garage). X = persen dari kiri, Y = persen dari atas, 0 sampai 100. Kosongkan keduanya kalau part ini cukup tampil di tabel.')
                    ->columns(2)
                    ->schema([
                        TextInput::make('hotspot_x')
                            ->label('X (% dari kiri)')
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(100)
                            ->step(0.01)
                            ->requiredWith('hotspot_y'),
                        TextInput::make('hotspot_y')
                            ->label('Y (% dari atas)')
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(100)
                            ->step(0.01)
                            ->requiredWith('hotspot_x'),
                    ]),
            ]);
    }
}
